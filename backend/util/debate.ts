import { DebateMessage } from "../types/debate.types";
import { llmMessage, llmRoles } from "../types/llm.types";

export function prepDebateHistory(
  debateHistory: DebateMessage[],
  debaterId: number
) {
  let finalLlmMessages: llmMessage[] = [];
  let tempMessageContent = "";

  for (let i = 0; i < debateHistory.length; i++) {
    const currentMessage = debateHistory[i];
    if (currentMessage.debaterId === debaterId) {
      if (tempMessageContent) {
        finalLlmMessages.push({
          role: llmRoles.USER,
          content: tempMessageContent,
        });
        console.log("Combined user messages: ", tempMessageContent);
        tempMessageContent = ""; // Reset the temporary message content
      }
      finalLlmMessages.push({
        role: llmRoles.ASSISTANT,
        content: currentMessage.llmMessage.content,
      });
      console.log("Assistant response: ", currentMessage.llmMessage.content);
    } else {
      tempMessageContent += currentMessage.llmMessage.content + "\n\n";
    }
  }

  // Check if there's any leftover USER message content to add
  if (tempMessageContent) {
    finalLlmMessages.push({
      role: llmRoles.USER,
      content: tempMessageContent.trim(),
    });
  }

  return finalLlmMessages;
}
