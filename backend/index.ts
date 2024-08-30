import "dotenv/config";
import readline from "readline";
import { WebSocketServer, WebSocket, MessageEvent } from "ws";
import { WSMessageTypes, WSRoute, WSMessage } from "./types/ws.types";
// import setup from "./routes/setup";
import debate from "./routes/debate";
import "dotenv/config";

const routes: Record<WSMessageTypes, WSRoute> = {
  [WSMessageTypes.SETUP]: debate.setup,
  [WSMessageTypes.START]: debate.start,
  [WSMessageTypes.NEXT]: debate.next,
};

async function routeMessage(ws: WebSocket, message: WSMessage) {
  // const message = JSON.parse(data);
  console.log("Received message: %s", message);

  // route the message to the appropriate route
  const messageType = message.type as WSMessageTypes;
  const route = routes[messageType];
  await route(ws, {
    type: messageType,
    content: message.content,
  });
}

async function main() {
  const wss = new WebSocketServer({ port: 8080 });

  wss.on("listening", () => {
    console.log("WebSocket server is listening on port 8080");
  });

  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });

  wss.on("connection", (ws) => {
    ws.on("message", (data, isBinary) => {
      if (isBinary) {
        console.log("Data is binary");
      } else {
        console.log("Data is not binary");
        const message = JSON.parse(data.toString());
        routeMessage(ws, message);
      }
    });
  });
}

main();
