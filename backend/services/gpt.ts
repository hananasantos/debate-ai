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
    console.log("Generating response with messages", messages);
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
      messages: messagesWithSystem,
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
