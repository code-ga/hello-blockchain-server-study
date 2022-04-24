import WebSocket from "ws";
import { WSType } from "./handlers";

export function decodeData(data: WebSocket.RawData) {
  return JSON.parse(data.toString());
}
export function encodeData<T>(
  emitName: string,
  data: T,
  type: string = "event"
) {
  return JSON.stringify({ emitName, data, type });
}
export const sendData = <T>(
  ws: WebSocket,
  emitName: string,
  data: T,
  type: string = "event"
) => {
  ws.send(encodeData<T>(emitName, data, type));
};

export const broadcast = (
  wss: WebSocket.Server<WebSocket.WebSocket>,
  ws: WSType,
  emitName: string,
  data: any,
  type: string = "event"
) => {
  wss.clients.forEach((client) => {
    /// @ts-ignore
    if (client.readyState === WebSocket.OPEN && client.id !== ws.id) {
      client.send(encodeData<any>(emitName, data, type));
    }
  });
};
