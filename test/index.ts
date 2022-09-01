import axios from "axios";
import fs from "fs";
import WebSocket from "ws";
import { sendData } from "./util";
import { BlockClass } from "./class/BlockClass";
import { TransactionsClass } from "./class/TransactionsClass";
import { decodeData } from "./util";
import path from "path";
import hashConditions from "./hashConditions";
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
  const host = "hello-blockchain-server-study.tritranduc.repl.co";
  const ws = new WebSocket("wss://" + host + "/", {
    perMessageDeflate: false,
  });
  let onHashSuccess = {
    isTrue: false,
  };
  const MyPublicKey =
      "04ec668e501b0c2d7067244463ffeea856f1e97938400bda929b0ca5c572016c448727240c6b75bfce0a4801cbbec0d7855b11f3399ad310426475c0ef9dc3a212",
    MyPrivateKey =
      "5b960c501936f6b7080839240b5b94b8d8792faec018d1c47f610801b0bf5936";

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
        const chain = [
          ...JSON.parse(
            fs.readFileSync(path.join(__dirname, "./chain.json"), "utf-8")
          ),
        ];

        const serverChain = [
          ...(await axios.get("https://" + host + "/blockchain/blockchain"))
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
            `https://${decodeData<string>(SocketData).data.replace(
              "{host}",
              host
            )}`
          )
        ).data.data;

        const lastBlock = await axios.get(
          "https://" + host + "/blockchain/lastBlock"
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
          lastBlock.data.data?.hash || "",
          hashConditions(
            Number(
              await (
                await axios.get(`https://${host}/info`)
              ).data.hashLevel
            )
          )
        );
        if (!block.hasValidTransactions()) {
          sendData(ws, "InvalidTransactions", {});
          console.log("invalid transaction");
          break;
        }
        block.mining(onHashSuccess.isTrue);
        if (!onHashSuccess.isTrue) {
          sendData(ws, "successMining", {
            hash: block.hash,
            noise: block.noise,
          });
        }
        break;
      case "getChain":
        ///@ts-ignore
        sendData(ws, "Chain", chain);
        break;
      case "HashNotEqual":
        sendData(ws, "startMining", true);
        break;
      case "successMining":
        onHashSuccess.isTrue = true;
        const newChain = (
          await axios.get("https://" + host + "/blockchain/blockchain")
        ).data.data;
        // write new chain to file
        fs.writeFileSync(
          path.join(__dirname, "./chain.json"),
          JSON.stringify(newChain)
        );

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
