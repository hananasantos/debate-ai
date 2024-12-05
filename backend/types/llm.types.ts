import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenAI } from "openai";
import ws from "ws";

export abstract class LLM {
  // TODO: Add Anthropic and GoogleGenerativeAI later
  abstract client: OpenAI | Anthropic | GoogleGenerativeAI;
  abstract defaultModel: OpenAiModels | AnthropicModels | GoogleAiModels;
  abstract responseRole: LlmRoles;
  static ws?: ws;
  protected systemPrompt: string;

  constructor(systemPrompt: string, ws?: ws) {
    this.systemPrompt = systemPrompt;
    if (ws) {
      LLM.ws = ws;
    }
  }

  abstract generateResponse(
    messages: LlmMessage[],
    stopFlag: { activated: boolean },
    model?: LlmModel
  ): Promise<string>;
  abstract generateJsonResponse(
    messages: LlmMessage[],
    stopFlag: { activated: boolean },
    model?: LlmModel
  ): Promise<any>;
  abstract generateResponseStream(
    messages: LlmMessage[],
    // stopFlag: { activated: boolean },
    model?: LlmModel
  ): Promise<string>;
}

export const MAX_REASONING_TOKENS = 15000;

export const validModels = {
  openai: [
    "o1-mini",
    "o1-preview",
    "gpt-4o",
    "gpt-4",
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-0125",
  ] as const,
  anthropic: ["claude-3-5-sonnet-20240620", "claude-3-opus-20240229"] as const,
  googleai: ["gemini-1.5-flash"] as const,
};

export type LlmType = "openai" | "anthropic" | "googleAi";

export type OpenAiModels =
  | "o1-mini"
  | "o1-preview"
  | "gpt-4o"
  | "gpt-4"
  | "gpt-3.5-turbo"
  | "gpt-3.5-turbo-0125";
export type GoogleAiModels = "gemini-1.5-flash";
export type AnthropicModels =
  | "claude-3-5-sonnet-20240620"
  | "claude-3-opus-20240229";

export type LlmModel = OpenAiModels | AnthropicModels | GoogleAiModels;

export enum LlmRoles {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
  // MODEL = "model",
}

export const OpenAiContextWindows: Record<
  (typeof validModels.openai)[number],
  number
> = {
  "o1-mini": 128000,
  "o1-preview": 128000,
  "gpt-4o": 128000,
  "gpt-4": 8192,
  "gpt-3.5-turbo": 16385,
  "gpt-3.5-turbo-0125": 16385,
};
export type LlmMessage = {
  role: LlmRoles;
  content: string;
};
