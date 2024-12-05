import { LLM, LlmMessage, LlmRoles, OpenAiModels } from "../types/llm.types";
import OpenAIClient from "openai";
import {
  ChatCompletion,
  ChatCompletionChunk,
} from "openai/resources/chat/completions";
import ws from "ws";

type GenerateParams = {
  model?: OpenAiModels;
  stream: boolean;
  response_format?: { type: "json_object" };
};

export default class OpenAi extends LLM {
  // set llm client as an openai one
  client = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY });
  defaultModel = "gpt-4o" as const;
  responseRole = LlmRoles.ASSISTANT;

  constructor(systemPrompt: string, ws?: ws) {
    super(systemPrompt, ws);
  }

  private formatMessages(messages: LlmMessage[], model: OpenAiModels) {
    const messagesWithSystem = [
      { role: LlmRoles.SYSTEM, content: this.systemPrompt },
      ...messages,
    ];
    const formattedMessages = messagesWithSystem.map((message) => {
      // gpt knows user and assistant roles
      if (
        message.role === LlmRoles.USER ||
        message.role === LlmRoles.ASSISTANT
      ) {
        return {
          role: message.role,
          content: message.content,
        };
      } else if (message.role === LlmRoles.SYSTEM) {
        // o1-mini and o1-preview do not support the system role
        if (model === "o1-mini" || model === "o1-preview") {
          return {
            role: LlmRoles.ASSISTANT,
            content: message.content,
          };
        } else {
          return {
            role: LlmRoles.SYSTEM,
            content: message.content,
          };
        }
      } else {
        throw new Error(`Invalid role for GPT Message: ${message.role}`);
      }
    });
    return formattedMessages;
  }

  private generate(messages: LlmMessage[], props: GenerateParams) {
    const modelToUse: OpenAiModels = props.model ?? this.defaultModel;
    const formattedMessages = this.formatMessages(messages, modelToUse);
    console.log(`Generating llm response with model: ${modelToUse}`);

    const requestObject = {
      ...props,
      model: modelToUse,
      messages: formattedMessages,
      temperature: ["o1-mini", "o1-preview"].includes(modelToUse) ? 1 : 0,
    };

    return this.client.chat.completions.create(requestObject);
  }

  public async generateResponse(
    messages: LlmMessage[],
    stopFlag: { activated: boolean },
    model?: OpenAiModels | undefined
  ) {
    const responsePromise = this.generate(messages, { model, stream: false });

    while (true) {
      if (stopFlag.activated) {
        console.log(`Stopping JSON generation due to stopFlag`);
        stopFlag.activated = false;
        return "";
      }

      const isResolved = await Promise.race([
        responsePromise.then(() => true),
        new Promise((resolve) => setTimeout(() => resolve(false), 100)), // Check every 100ms
      ]);

      if (isResolved) {
        break;
      }
    }
    const response = (await responsePromise) as ChatCompletion;
    const textContent = response.choices[0].message.content;
    if (!textContent)
      return Promise.reject(new Error("No content in response from GPT"));
    return textContent;
  }

  public async generateJsonResponse(
    messages: LlmMessage[],
    stopFlag: { activated: boolean },
    model?: OpenAiModels | undefined
  ) {
    const responsePromise = this.generate(messages, {
      model,
      stream: false,
      response_format: { type: "json_object" },
    });

    while (true) {
      if (stopFlag.activated) {
        console.log(`Stopping JSON generation due to stopFlag`);
        stopFlag.activated = false;
        return "";
      }

      const isResolved = await Promise.race([
        responsePromise.then(() => true),
        new Promise((resolve) => setTimeout(() => resolve(false), 100)), // Check every 100ms
      ]);

      if (isResolved) {
        break;
      }
    }
    const response = (await responsePromise) as ChatCompletion;
    const textContent = response.choices[0].message.content;
    if (!textContent)
      return Promise.reject(new Error("No content in response from GPT"));
    return JSON.parse(textContent);
  }

  public async generateResponseStream(
    messages: LlmMessage[],
    stopFlag: { activated: boolean },
    model?: OpenAiModels | undefined
  ) {
    if (!LLM.ws) {
      console.error("This LLM was not instantiated with a websocket");
      return "";
    }
    let content: string = "";
    const streamPromise = this.generate(messages, { model, stream: true });
    const stream = (await streamPromise) as AsyncIterable<ChatCompletionChunk>;
    for await (const chunk of stream) {
      if (chunk.choices[0].delta.content) {
        const chunkContent = chunk.choices[0].delta.content;
        if (stopFlag.activated) {
          stopFlag.activated = false;
          break;
        }
        content += chunkContent;
        LLM.ws.send(
          JSON.stringify({
            type: "answerStream",
            payload: {
              chunk: chunkContent,
            },
          })
        );
      }
    }
    return content;
  }
}
