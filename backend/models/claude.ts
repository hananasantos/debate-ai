import AnthropicClient from "@anthropic-ai/sdk";
import ws from "ws";
import {
  AnthropicModels,
  DeepSearchModels,
  LLM,
  LlmMessage,
  LlmRoles,
} from "../types/llm.types";

export default class Anthropic extends LLM {
  client = new AnthropicClient({ apiKey: process.env.ANTHROPIC_API_KEY });
  defaultModel = "claude-3-opus-20240229" as const;
  deepSearchModel = DeepSearchModels.ANTHROPIC;
  responseRole = LlmRoles.ASSISTANT;

  constructor(systemPrompt: string, ws?: ws) {
    super(systemPrompt, ws);
  }

  private formatMessages(messages: LlmMessage[]) {
    // add the system prompt to the first message if it is a user message
    let messagesWithAssistant: LlmMessage[];
    if (messages[0].role === LlmRoles.USER) {
      const firstMessage = messages[0].content + "\n\n" + this.systemPrompt;
      // use the new combined first message
      messagesWithAssistant = [
        { role: LlmRoles.USER, content: firstMessage },
        ...messages.slice(1),
      ];
    } else {
      messagesWithAssistant = [
        { role: LlmRoles.USER, content: this.systemPrompt },
        ...messages,
      ];
    }
    return messagesWithAssistant.map((message) => {
      if (message.role === LlmRoles.USER) {
        return {
          role: "user" as const,
          content: message.content,
        };
      } else if (message.role === LlmRoles.ASSISTANT) {
        return {
          role: "assistant" as const,
          content: message.content,
        };
      } else {
        throw new Error("Invalid role for Claude Message: " + message.role);
      }
    });
  }

  async generateResponse(
    messages: LlmMessage[],
    stopFlag: { activated: boolean },
    model?: AnthropicModels
  ) {
    const formattedMessages = this.formatMessages(messages);
    const responsePromise = this.client.messages.create({
      max_tokens: 1024,
      messages: formattedMessages,
      model: model || this.defaultModel,
    });
    while (true) {
      if (stopFlag.activated) {
        console.log(`Stopping response generation due to stopFlag`);
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
    const response = await responsePromise;
    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";
    return responseText;
  }

  // Anthropic api's don't really have a json parameter
  // so we just add json to the prompt, and append an assistant message
  // that starts with the json response ("{");
  async generateJsonResponse(
    messages: LlmMessage[],
    stopFlag: { activated: boolean },
    model?: AnthropicModels
  ) {
    let messagesWithJsonPrompt = [...messages];
    const jsonPrompt =
      "A json response is required for machine parsing. Please respond with a json object.";

    // if the last message is a user message, add json prompt to its content
    if (
      messagesWithJsonPrompt[messagesWithJsonPrompt.length - 1].role === "user"
    ) {
      messagesWithJsonPrompt[messagesWithJsonPrompt.length - 1].content +=
        "\n\n" + jsonPrompt;
    } else {
      messagesWithJsonPrompt.push({
        role: LlmRoles.USER,
        content: jsonPrompt,
      });
    }

    // then add assistant message that starts with the json response ("{")
    messagesWithJsonPrompt.push({
      role: LlmRoles.ASSISTANT,
      content: "{",
    });

    // then its a normal generate response call
    const responseText = await this.generateResponse(
      messagesWithJsonPrompt,
      stopFlag,
      model
    );

    // json parse response (remember to add the "{" to the beginning of the response)
    const jsonText = responseText.startsWith("{")
      ? responseText
      : `{${responseText}`;

    // if there was an error parsing the json, return an empty string (need to define error handling eventually)
    try {
      return JSON.parse(jsonText);
    } catch (error) {
      console.error(error, "Error parsing json response: ");
      return "";
    }
  }

  async generateResponseStream(
    messages: LlmMessage[],
    stopFlag: { activated: boolean },
    model?: AnthropicModels
  ) {
    if (!LLM.ws) {
      console.error("This LLM was not instantiated with a websocket");
      return "";
    }

    let content: string = "";
    const ws = LLM.ws;
    const formattedMessages = this.formatMessages(messages);
    const stream = await this.client.messages.create({
      max_tokens: 1024,
      messages: formattedMessages,
      model: model || this.defaultModel,
      stream: true,
    });
    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta") {
        const chunkText =
          chunk.delta.type === "text_delta" ? chunk.delta.text : "";
        content += chunkText;

        LLM.ws.send(
          JSON.stringify({
            type: "answerStream",
            payload: {
              chunk: chunkText,
            },
          })
        );
      }
      if (stopFlag.activated) {
        stopFlag.activated = false;
        break;
      }
    }
    return content;
  }
}
