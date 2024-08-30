import { OpenAI } from "openai";
import { Anthropic } from "@anthropic-ai/sdk";

export abstract class LLM {
  protected client: OpenAI | Anthropic; // the llm client to make requests to
  public model: string; // the model to use
  public topic: string; // user-inputted topic for system prompt. Does this need to be here?
  protected systemPrompt: string; // the system prompt to use for llm requests
  public debaterId: number; // the debater id so the LLM knows which debater it is

  /* LLM constructor details:
    - llmType for the type of llm client to use
    - user-inputted debate stance for system prompt
    - user-inputted personality for system prompt
    - user-inputted debate topic for system prompt
    - debaterId so the LLM knows which debater it is
  */
  constructor(
    llmType: "gpt" | "claude",
    stance: string,
    personality: string,
    topic: string,
    debaterId: number
  ) {
    // create client
    if (llmType === "gpt") {
      this.client = new OpenAI();
      this.model = "gpt";
    } else {
      this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      this.model = "claude";
    }

    // setup system prompt
    this.topic = topic;
    this.debaterId = debaterId;
    this.systemPrompt = `You are participating in a debate as Debator ${debaterId}
    The debate topic:
    ${topic}

    Your stance on this topic:
    ${stance}

    Your personality:
    ${personality}
    `;
  }

  // specific llms have different chat apis so they must implement this
  // it expects basic functionality: Given these LLM messages, return a string response
  abstract generateResponse(messages: llmMessage[]): Promise<string>;
}

// enum for the roles of the llm, helps with llm api typing
export enum llmRoles {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
}

// type for the messages of the llm, vs wsMessages, vs debateMessages
// I don't want to think about what happens if a new llm we add uses a different message schema
export type llmMessage = {
  role: llmRoles;
  content: string;
};
