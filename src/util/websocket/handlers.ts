import WebSocket from "ws";
import { BlockClass } from "../../core/Blockchain/BlockClass";
import {
  addBlockToChain,
  getLastBlock,
  getPendingTransactions,
  setPendingTransactions,
} from "../../core/util/db";
import { broadcast, decodeData, sendData } from "./util";
import {
  deleteFirstPendingTransaction,
  addPendingTransaction,
} from "./../../core/util/db";
import { TransactionsClass } from "../../core/Blockchain/TransactionsClass";

export interface WSType extends WebSocket.WebSocket {
  id?: string;
}

const MiningData: {
  [clientId: string]: {
    connected: boolean;
    MinerPublicKey: string;
  };
} = {};

export const getUuid = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default async function handlersWebSocket(
  wss: WebSocket.Server<WebSocket.WebSocket>
) {
  wss.on("connection", async function connection(ws: WSType) {
    ws.id = getUuid();
    ws.on("message", async function message(SocketData) {
      const { emitName, data, _type } = decodeData(SocketData);
      switch (emitName) {
        case "CheckConnect":
          sendData(ws, "CheckConnect", true);
          MiningData[ws.id] = {
            connected: true,
            MinerPublicKey: "",
          };
          break;
        case "MinerPublicKey":
          MiningData[ws.id] = {
            connected: true,
            MinerPublicKey: data,
          };
          sendData(ws, "MinerPublicKeySuccess", true);
          sendData(ws, "NodeId", ws.id);
          break;
        case "startMining":
          sendData(ws, "startMining", "{host}/transaction/pending");
          break;
        case "successMining":
          const PendingTransactionsData = [
            ...[(await getPendingTransactions())[0]],
          ];
          const block = new BlockClass(
            PendingTransactionsData,
            (await getLastBlock())?.hash || "",
            PendingTransactionsData[0].timestamp,
            {
              MinerPublicKey: MiningData[ws.id].MinerPublicKey,
              nodeId: ws.id,
            }
          );
          if (!block.hasValidTransactions()) {
            console.log("invalid transaction");
            break;
          }
          block.noise = data.noise;
          block.testBlock();
          if (!block.conditions(block.hash)) {
            sendData(ws, "HashNotEqual", {});
          }
          if (data.hash != block.hash) {
            sendData(ws, "HashNotEqual", {});
          } else {
            await addBlockToChain(block);
            await setPendingTransactions([])
            addPendingTransaction(
              new TransactionsClass(
                null,
                MiningData[ws.id].MinerPublicKey,
                10,
                Date.now()
              )
            ).then(() => {
              broadcast(wss, ws, "successMining", {});
              sendData(ws, "successMining", {});
            });
          }
          console.log(data, block, data.hash != block.hash);
          break;
        case "ChainNotEqual":
          broadcast(wss, ws, "getChain", {});
          // get chain from all client and return to client chain have lots off client to send
          break;
        case "Chain":
          console.log(data);
          break;
        case "InvalidTransactions":
          break;
        default:
          console.log(`${emitName} ${data}`);
          break;
      }
    });
    ws.on("close", function close() {
      delete MiningData[ws.id];
    });
  });
}
