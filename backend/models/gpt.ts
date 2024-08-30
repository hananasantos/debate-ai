import { LLM, llmMessage, llmRoles } from "../types/llm.types";
import { OpenAI } from "openai";
import { WebSocket } from "ws";

export default class GPT extends LLM {
  // set llm client as an openai one
  private openAiClient: OpenAI;
  private ws: WebSocket;
  constructor(
    stance: string,
    personality: string,
    topic: string,
    ws: WebSocket,
    debaterId: number
  ) {
    super("gpt", stance, personality, topic, debaterId);
    this.openAiClient = this.client as OpenAI;
    this.ws = ws;
  }

  async generateResponse(messages: llmMessage[]) {
    let content: string = "";
    const messagesWithSystem = [
      { role: llmRoles.SYSTEM, content: this.systemPrompt },
      ...messages,
    ];
    this.ws.send(
      JSON.stringify({
        type: "startStream",
        content: { debaterId: this.debaterId },
      })
    );
    const stream = await this.openAiClient.chat.completions.create({
      messages: messagesWithSystem.map((message) => {
        if (
          message.role === llmRoles.USER ||
          message.role === llmRoles.ASSISTANT ||
          message.role === llmRoles.SYSTEM
        ) {
          return {
            role: message.role,
            content: message.content,
          };
        } else if (message.role === llmRoles.MODEL) {
          return {
            role: llmRoles.ASSISTANT,
            content: message.content,
          };
        } else {
          throw new Error("Invalid role for GPT Message: " + message.role);
        }
      }),
      model: "gpt-4o",
      stream: true,
    });
    for await (const chunk of stream) {
      if (chunk.choices[0].delta.content) {
        const chunkContent = chunk.choices[0].delta.content;
        content += chunkContent;
        this.ws.send(
          JSON.stringify({ type: "answerStream", content: chunkContent })
        );
      }
    }
    this.ws.send(
      JSON.stringify({
        type: "endStream",
        content: { debaterId: this.debaterId },
      })
    );
    return content;
  }
}
