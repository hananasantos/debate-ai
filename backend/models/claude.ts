import Anthropic from "@anthropic-ai/sdk";
import { LLM, llmMessage, llmRoles } from "../types/llm.types";
import { WebSocket } from "ws";

export default class CLAUDE extends LLM {
  //set llm client as an anthropic one
  private anthropicClient: Anthropic;
  private ws: WebSocket;

  constructor(
    stance: string,
    personality: string,
    topic: string,
    ws: WebSocket,
    debaterId: number
  ) {
    super("claude", stance, personality, topic, debaterId);
    this.anthropicClient = this.client as Anthropic;
    this.ws = ws;
  }

  async generateResponse(messages: llmMessage[]) {
    let content: string = "";
    console.log("Generating response with messages: ", messages);
    let messagesWithAssistant: llmMessage[];
    if (messages[0].role === llmRoles.USER) {
      const firstMessage = messages[0].content + "\n\n" + this.systemPrompt;
      // use the new combined first message
      messagesWithAssistant = [
        { role: llmRoles.USER, content: firstMessage },
        ...messages.slice(1),
      ];
    } else {
      messagesWithAssistant = [
        { role: llmRoles.USER, content: this.systemPrompt },
        ...messages,
      ];
    }
    this.ws.send(
      JSON.stringify({
        type: "startStream",
        content: { debaterId: this.debaterId },
      })
    );
    const stream = this.anthropicClient.messages
      .stream({
        max_tokens: 1024,
        messages: messagesWithAssistant.map((message) => {
          if (message.role === llmRoles.USER) {
            return {
              role: "user",
              content: message.content,
            };
          } else if (message.role === llmRoles.ASSISTANT) {
            return {
              role: "assistant",
              content: message.content,
            };
          } else {
            throw new Error("Invalid role for Claude Message: " + message.role);
          }
        }),
        model: "claude-3-opus-20240229",
      })
      .on("text", (text) => {
        this.ws.send(JSON.stringify({ type: "answerStream", content: text }));
        content += text;
      });
    const finalMessage = await stream.finalMessage();
    this.ws.send(
      JSON.stringify({
        type: "endStream",
        content: { debaterId: this.debaterId },
      })
    );
    console.log(finalMessage);
    return content;
  }
}
