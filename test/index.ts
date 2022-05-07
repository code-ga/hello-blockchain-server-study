import axios from "axios";
import fs from "fs";
import WebSocket from "ws";
import { sendData } from "./../src/util/websocket/util";
import { BlockClass } from "./BlockClass";
import { TransactionsClass } from "./TransactionsClass";
import { decodeData } from "./util";
// equal object
const equalObject = (obj1: any[], obj2: any[]) => {
  if (obj1.length != obj2.length) {
    return false;
  }
  for (let i = 0; i < obj1.length; i++) {
    if (JSON.stringify(obj1[i]) != JSON.stringify(obj2[i])) {
      return false;
    }
  }
  return true;
};
const main = async () => {
  const ws = new WebSocket("ws://127.0.0.1:8000/", {
    perMessageDeflate: false,
  });
  let onHashSuccess = {
    isTrue: false,
  };
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
      case "MinerPublicKeySuccess":
        sendData(ws, "startMining", true);
        break;
      case "startMining":
        onHashSuccess.isTrue = false;
        const chain = [...JSON.parse(fs.readFileSync("./chain.json", "utf-8"))];

        const serverChain = [
          ...(await axios.get("http://localhost:8000/blockchain/blockchain"))
            .data.data,
        ];
        if (
          chain.length != serverChain.length ||
          (!equalObject(serverChain, chain) && chain.length > 0)
        ) {
          console.log(chain, serverChain);
          console.log("chain is not equal");
          // send to server my chain is not equal server chain
          sendData(ws, "ChainNotEqual", {});
          break;
        }
        const transactionData: {
          _events: any;
          _eventsCount: number;
          fromAddress: string | null | undefined;
          toAddress: string | null | undefined;
          amount: number;
          timestamp: number;
        }[] = (
          await axios.get(
            decodeData<string>(SocketData).data.replace(
              "{host}",
              "http://localhost:8000"
            )
          )
        ).data.data;
        const lastBlock = await axios.get(
          "http://localhost:8000/blockchain/lastBlock"
        );
        const transactionsArray = transactionData.map((transaction) => {
          return new TransactionsClass(
            transaction.fromAddress,
            transaction.toAddress,
            transaction.amount,
            transaction.timestamp
          );
        });
        if (transactionsArray.length == 0) {
          console.log("no transaction");
          break;
        }
        console.log(lastBlock.data);
        const block = new BlockClass(
          transactionsArray,
          lastBlock.data.data?.hash || ""
        );
        if (!block.hasValidTransactions()) {
          sendData(ws, "InvalidTransactions", {});
          console.log("invalid transaction");
          break;
        }
        block.mining();
        sendData(ws, "successMining", {
          hash: block.hash,
          noise: block.noise,
        });
        break;
      case "getChain":
        sendData(ws, "Chain", chain);
        break;
      case "HashNotEqual":
        sendData(ws, "startMining", true);
        break;
      case "successMining":
        onHashSuccess.isTrue = true;
        const newChain = (
          await axios.get("http://localhost:8000/blockchain/blockchain")
        ).data.data;
        // write new chain to file
        fs.writeFileSync("./chain.json", JSON.stringify(newChain));

        sendData(ws, "startMining", true);
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
