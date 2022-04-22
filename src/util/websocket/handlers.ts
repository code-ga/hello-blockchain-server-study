import WebSocket from "ws";
import { sendData } from "./util";

export default async function handlersWebSocket(
  wss: WebSocket.Server<WebSocket.WebSocket>
) {
  wss.on("connection", function connection(ws) {
    ws.on("message", function message(data) {
      console.log("received: %s", data);
    });

    sendData(ws, "message", "Hello World!");
  });
}
