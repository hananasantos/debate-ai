import { llmRoles, llmMessage } from "./llm.types";

// A somewhat slap-dash type to represent a debate message
export type DebateMessage = {
  title: string; // maybe unnecessary. added in case we want to supply it to ws.sends to client
  llmMessage: llmMessage; // the message {llmrole, content}. llmrole is always user, and is changed upon llm request
  debaterId: number; // the debater id that allows us to identify who said what, so we can change the prompt roles as needed
};

// Debater Ids are: 0 for moderator, 1 for debater 1, 2 for debater 2
