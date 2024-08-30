import { WebSocket } from "ws";

export interface WSMessage {
  type: string;
  content: any;
}

export enum WSMessageTypes {
  SETUP = "setup",
  START = "start",
  NEXT = "next",
}

export interface WSRoute {
  (ws: WebSocket, message: WSMessage): Promise<any>;
}
