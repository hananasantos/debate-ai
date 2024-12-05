// import Anthropic from "@anthropic-ai/sdk";
import { LLM, LlmType, LlmMessage, LlmRoles } from "../types/llm.types";
import { WebSocket } from "ws";
import Claude from "../models/claude";
import GPT from "../models/gpt";

export default class Debater {
  //set llm client as an anthropic one
  //   private anthropicClient: Anthropic;
  private llm: LLM;
  private systemPrompt: string;
  public responseRole: LlmRoles;

  constructor(
    stance: string,
    personality: string,
    topic: string,
    public debaterId: number,
    public llmType: LlmType,
    private ws: WebSocket
  ) {
    this.systemPrompt = `You are participating in a debate as Debater ${debaterId} and are not moderating.
    The debate topic:
    ${topic}

    Your stance on this topic:
    ${stance}

    Your personality:
    ${personality}
    
    Please keep your answers to plain text.
    `;

    this.llm =
      llmType === "anthropic"
        ? new Claude(this.systemPrompt, ws)
        : new GPT(this.systemPrompt, ws);
    this.responseRole = this.llm.responseRole;
    this.ws = ws;
  }

  async generateResponse(messages: LlmMessage[]) {
    let content: string = "";
    console.log("Generating response with messages: ", messages);
    // let messagesWithAssistant: LlmMessage[];
    // if (messages[0].role === LlmRoles.USER) {
    //   const firstMessage = messages[0].content + "\n\n" + this.systemPrompt;
    //   // use the new combined first message
    //   messagesWithAssistant = [
    //     { role: llmRoles.USER, content: firstMessage },
    //     ...messages.slice(1),
    //   ];
    // } else {
    //   messagesWithAssistant = [
    //     { role: llmRoles.USER, content: this.systemPrompt },
    //     ...messages,
    //   ];
    // }
    this.ws.send(
      JSON.stringify({
        type: "startStream",
        content: { debaterId: this.debaterId },
      })
    );
    const finalMessage = await this.llm.generateResponseStream(messages);
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
