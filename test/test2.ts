import WebSocket from "ws";
import { decodeData } from "./util";
import { sendData } from "./../src/util/websocket/util";
import axios from "axios";
import fs from "fs";
const main = async () => {
  const chain = [1];

  const ws = new WebSocket("ws://127.0.0.1:8000/", {
    perMessageDeflate: false,
  });

  const MyPublicKey =
      "04ae21d99cf0b80a4531fe53e7f258ff1b3c9b35ae9c340b29aa25292fe8fbcb53d5fbb23eca0dd290a0cae707aeba76e21906e3de5f8407081e56918513f08d39",
    MyPrivateKey =
      "4cf5e2bc455c65b8ea643575f50e262e0b6ba18c7e2cd0445f2bfa5dba477ba1";

  ws.on("open", function open() {
    console.log("connected");
    sendData(ws, "CheckConnect", true);
  });
  ws.on("message", async function message(SocketData) {
    const { emitName, data, type } = decodeData(SocketData);
    switch (emitName) {
      case "CheckConnect":
        sendData(ws, "MinerPublicKey", MyPublicKey);
        break;
      case "startMining":
        const serverChain = [
          ...(await axios.get("http://localhost:8000/blockchain/blockchain"))
            .data.data,
        ];
        if (
          chain.length != serverChain.length ||
          (chain != serverChain && chain.length > 0)
        ) {
          console.log("chain is not equal");
          // send to server my chain is not equal server chain
          sendData(ws, "ChainNotEqual", {});
          break;
        }
        break;
      case "getChain":
        sendData(ws, "Chain", chain);
        break;
      default:
        console.log(`${emitName} ${data}`);
        break;
    }
  });
  ws.on("close", function close() {
    console.log("disconnected");
  });
};
main().catch(console.error);
