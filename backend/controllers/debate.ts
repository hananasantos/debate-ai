import { LLM, LlmMessage, LlmRoles } from "../types/llm.types";
import Debater from "../agents/debater";
import { WebSocket } from "ws";
import { DebateMessage } from "../types/debate.types";
import { prepDebateHistory } from "../util/debate";

type DebateSetup = {
  debater1: Debater;
  debater2: Debater;
  topic: string;
};

export default class Debate {
  private debater1: Debater;
  private debater2: Debater;
  private topic: string;
  private currentDebater: Debater;
  private ws: WebSocket;
  public debateHistory: DebateMessage[];

  constructor(setup: DebateSetup, ws: WebSocket) {
    this.debater1 = setup.debater1;
    this.debater2 = setup.debater2;
    this.topic = setup.topic;
    this.debateHistory = [];
    this.currentDebater = this.decideFirstDebater();
    this.ws = ws;
  }

  private decideFirstDebater() {
    const random = Math.random();
    console.log(
      "First debater: ",
      random < 0.5 ? this.debater1.llmType : this.debater2.llmType
    );
    return random < 0.5 ? this.debater1 : this.debater2;
  }

  // TODO: Error catching: Make sure debateHistory isn't empty
  private async advance(debater: Debater, next: DebateMessage) {
    console.log("Advancing LLM: ", debater.llmType, " with prompt: ", next);
    this.debateHistory.push(next);
    // prepare debate history into llm messages
    const llmMessages = prepDebateHistory(
      this.debateHistory,
      debater.debaterId,
      debater.responseRole
    );

    // generate response
    const responseContent = await debater.generateResponse(llmMessages);
    const content = `Debater ${debater.debaterId}: '${responseContent}'`;
    // add response to debate history
    const newDebateMessage = {
      debaterId: debater.debaterId,
      title: `Debater ${debater.debaterId}`,
      llmMessage: {
        role: debater.responseRole,
        content,
      },
    };
    this.debateHistory.push(newDebateMessage);
  }

  public async start() {
    const beginPrompt = `Moderator: 'Welcome to this debate hosted on Debate AI!
    
    Today's debate topic:
    ${this.topic}.
    
    We will now begin with our first debater, Debater ${this.currentDebater.debaterId}.
    Debater ${this.currentDebater.debaterId}, please give us your opening statement.'`;

    this.ws.send(JSON.stringify({ type: "startDebate", content: beginPrompt }));

    await this.advance(this.currentDebater, {
      debaterId: 0,
      title: `Moderator`,
      llmMessage: {
        role: LlmRoles.USER,
        content: beginPrompt,
      },
    });
    console.log("Debate started messages: ", this.debateHistory);
  }

  public async switchDebater() {
    this.currentDebater =
      this.currentDebater === this.debater1 ? this.debater2 : this.debater1;

    const nextPrompt = `Moderator: 'We will now allow the other debater to respond.'`;

    this.ws.send(JSON.stringify({ type: "moderator", content: nextPrompt }));

    await this.advance(this.currentDebater, {
      debaterId: 0,
      title: `Moderator`,
      llmMessage: {
        role: LlmRoles.USER,
        content: nextPrompt,
      },
    });
  }
}
