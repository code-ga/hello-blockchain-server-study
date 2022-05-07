import WebSocket from "ws";

interface defaultDataType<DataT> {
  emitName: string;
  data: DataT;
  type: string;
}
/**
 * Decode data from websocket
 * @description Decode data from websocket
 * @param {WebSocket.RawData} data data from websocket 
 * @returns defaultDataType<DataT>
 */
export function decodeData<DataT>(data: WebSocket.RawData): defaultDataType<DataT> {
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
