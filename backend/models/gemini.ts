import { LLM, llmMessage, llmRoles } from "../types/llm.types";
import { ChatSession, GenerativeModel } from "@google/generative-ai";
import { WebSocket } from "ws";

export default class GEMINI extends LLM {
  private geminiClient: GenerativeModel;
  private ws: WebSocket;

  constructor(
    stance: string,
    personality: string,
    topic: string,
    ws: WebSocket,
    debaterId: number
  ) {
    super("gemini", stance, personality, topic, debaterId);
    this.geminiClient = this.client as GenerativeModel;
    this.ws = ws;
  }

  private prepHistory(messages: llmMessage[]) {
    return messages.map((message) => ({
      role: message.role,
      parts: [{ text: message.content }],
    }));
  }

  async generateResponse(messages: llmMessage[]): Promise<string> {
    let messagesWithSystem: llmMessage[];
    if (messages[0].role === llmRoles.USER) {
      const firstMessage = this.systemPrompt + "\n\n" + messages[0].content;
      // use the new combined first message
      messagesWithSystem = [
        { role: llmRoles.USER, content: firstMessage },
        ...messages.slice(1),
      ];
    } else {
      messagesWithSystem = [
        { role: llmRoles.USER, content: this.systemPrompt },
        ...messages,
      ];
    }

    const newMessage = messagesWithSystem[messagesWithSystem.length - 1];
    const previousHistory = this.prepHistory(messagesWithSystem).slice(0, -1);

    console.log("History received by Gemini: ", previousHistory);
    console.log("New message received by Gemini: ", newMessage);
    let response = "";
    try {
      const geminiChat = this.geminiClient.startChat({
        history: previousHistory,
      });
      this.ws.send(
        JSON.stringify({
          type: "startStream",
          content: { debaterId: this.debaterId },
        })
      );
      const geminiResponse = await geminiChat.sendMessageStream(
        newMessage.content
      );
      for await (const chunk of geminiResponse.stream) {
        const text = chunk.text();
        this.ws.send(
          JSON.stringify({
            type: "answerStream",
            content: text,
          })
        );
        response += text;
      }
      this.ws.send(
        JSON.stringify({
          type: "endStream",
          content: { debaterId: this.debaterId },
        })
      );
    } catch (error) {
      console.error(error);
      this.ws.send(
        JSON.stringify({
          type: "endStream",
          content: { debaterId: this.debaterId },
        })
      );
    }
    return response;
  }
}
