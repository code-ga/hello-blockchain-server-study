import WebSocket from "ws";
import { decodeData } from "./util";

const ws = new WebSocket("ws://127.0.0.1:8000/", {
    perMessageDeflate: false,
    
});

ws.on("open", function open() {
  console.log("connected");
});
ws.on("message", function message(data) {
    console.log(decodeData(data));   
//   console.log("received: %s");
});
ws.on("close", function close() {
    console.log("disconnected");
});
