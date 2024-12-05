import {
  AnthropicModels,
  LLM,
  LlmMessage,
  LlmRoles,
  OpenAiModels,
} from "../types/llm.types";
import {
  ChatSession,
  GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import { WebSocket } from "ws";

export default class GEMINI extends LLM {
  client: GenerativeModel;
  defaultModel = "gemini-1.5-flash" as const;
  responseRole = LlmRoles.MODEL;

  constructor(systemPrompt: string, ws: WebSocket) {
    super(systemPrompt, ws);
    let apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not set");
    }
    let googleAi = new GoogleGenerativeAI(apiKey);
    this.client = googleAi.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  private prepHistory(messages: LlmMessage[]) {
    return messages.map((message) => ({
      role: message.role,
      parts: [{ text: message.content }],
    }));
  }

  async generateResponseStream(messages: LlmMessage[]): Promise<string> {
    if (!LLM.ws) {
      console.error("This LLM was not instantiated with a websocket");
      return "";
    }
    let messagesWithSystem: LlmMessage[];
    if (messages[0].role === LlmRoles.USER) {
      const firstMessage = this.systemPrompt + "\n\n" + messages[0].content;
      // use the new combined first message
      messagesWithSystem = [
        { role: LlmRoles.USER, content: firstMessage },
        ...messages.slice(1),
      ];
    } else {
      messagesWithSystem = [
        { role: LlmRoles.USER, content: this.systemPrompt },
        ...messages,
      ];
    }

    const newMessage = messagesWithSystem[messagesWithSystem.length - 1];
    const previousHistory = this.prepHistory(messagesWithSystem).slice(0, -1);

    console.log("History received by Gemini: ", previousHistory);
    console.log("New message received by Gemini: ", newMessage);
    let response = "";
    try {
      const geminiChat = this.client.startChat({
        history: previousHistory,
      });
      const geminiResponse = await geminiChat.sendMessageStream(
        newMessage.content
      );
      for await (const chunk of geminiResponse.stream) {
        const text = chunk.text();
        LLM.ws.send(
          JSON.stringify({
            type: "answerStream",
            content: text,
          })
        );
        response += text;
      }
    } catch (error) {
      console.error(error);
      throw new Error("Error generating response with Gemini");
    }
    return response;
  }
}
