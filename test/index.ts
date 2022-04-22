import WebSocket from "ws";

const ws = new WebSocket("ws://www.host.com/path", {
  perMessageDeflate: false,
});
