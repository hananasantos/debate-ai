import { LLM, llmMessage, llmRoles } from "../types/llm.types";
import { WebSocket } from "ws";
import { DebateMessage } from "../types/debate.types";
import { prepDebateHistory } from "../util/debate";

type DebateSetup = {
  llm1: LLM;
  llm2: LLM;
  topic: string;
};

export default class Debate {
  private llm1: LLM;
  private llm2: LLM;
  private topic: string;
  private currentDebater: LLM;
  private ws: WebSocket;
  public debateHistory: DebateMessage[];

  constructor(setup: DebateSetup, ws: WebSocket) {
    this.llm1 = setup.llm1;
    this.llm2 = setup.llm2;
    this.topic = setup.topic;
    this.debateHistory = [];
    this.currentDebater = this.decideFirstDebater();
    this.ws = ws;
  }

  private decideFirstDebater() {
    const random = Math.random();
    console.log(
      "First debater: ",
      random < 0.5 ? this.llm1.model : this.llm2.model
    );
    return random < 0.5 ? this.llm1 : this.llm2;
  }

  // TODO: Error catching: Make sure debateHistory isn't empty
  private async advanceLlm(llm: LLM, next: DebateMessage) {
    console.log("Advancing LLM: ", llm.model, " with prompt: ", next);
    this.debateHistory.push(next);
    // prepare debate history into llm messages
    const llmMessages = prepDebateHistory(this.debateHistory, llm.debaterId);

    // generate response
    const responseContent = await llm.generateResponse(llmMessages);
    const content = `Debater ${llm.debaterId}: '${responseContent}'`;
    // add response to debate history
    const newDebateMessage = {
      debaterId: llm.debaterId,
      title: `Debater ${llm.debaterId}`,
      llmMessage: {
        role: llmRoles.USER,
        content,
      },
    };
    this.debateHistory.push(newDebateMessage);
  }

  public async start() {
    const beginPrompt = `Moderator: 'Welcome to this debate hosted on Debate AI!
    
    Today's debate topic:
    ${this.topic}.
    
    We will now begin with our first debater!'`;

    this.ws.send(JSON.stringify({ type: "startDebate", content: beginPrompt }));

    await this.advanceLlm(this.currentDebater, {
      debaterId: 0,
      title: `Moderator`,
      llmMessage: {
        role: llmRoles.USER,
        content: beginPrompt,
      },
    });
    console.log("Debate started messages: ", this.debateHistory);
  }

  public async switchDebater() {
    this.currentDebater =
      this.currentDebater === this.llm1 ? this.llm2 : this.llm1;

    const nextPrompt = `Moderator: 'We will now allow the other debater to respond.'`;

    this.ws.send(JSON.stringify({ type: "moderator", content: nextPrompt }));

    await this.advanceLlm(this.currentDebater, {
      debaterId: 0,
      title: `Moderator`,
      llmMessage: {
        role: llmRoles.USER,
        content: nextPrompt,
      },
    });
  }
}
