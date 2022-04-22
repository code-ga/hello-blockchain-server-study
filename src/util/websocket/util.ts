import WebSocket from "ws";

export function decodeData(data: WebSocket.RawData) {
  return JSON.parse(data.toString());
}
export function encodeData<T>(
  emitName: string,
  data: T,
  type: string = "event"
) {
  return JSON.stringify({ emitName, data , type });
}
export const sendData = <T>(
  ws: WebSocket,
  emitName: string,
  data: T,
  type: string = "event"
) => {
  ws.send(encodeData<T>(emitName, data, type));
};
