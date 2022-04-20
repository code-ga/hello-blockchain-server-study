import { Server as SocketServer } from "socket.io";
import {
  ClientToServerEvents as SocketClientToServerEvents,
  InterServerEvents as SocketInterServerEvents,
  ServerToClientEvents as SocketServerToClientEvents,
  SocketData,
} from "../../types/SocketIoType";
const MiningData: {
  [clientId: string]: {
    connected: boolean;
    MinerPublicKey?: string;
  };
} = {};

export default async function SocketIoHandles(
  io: SocketServer<
    SocketClientToServerEvents,
    SocketServerToClientEvents,
    SocketInterServerEvents,
    SocketData
  >
) {
  io.on("connection", (socket) => {
    socket.emit("checkConnection", true);
    console.log(`a user connected: ${socket.id}`);
    socket.on("connectOk", () => {
      MiningData[socket.id] = {
        connected: true,
      };
      console.log(MiningData);
    });
    socket.on("registerMiner", (data) => {
      MiningData[socket.id] = {
        connected: true,
        MinerPublicKey: data.MinerPublicKey,
      };
      console.log(MiningData);
    });
      socket.on("startMining", () => { 
          socket.emit("startMining", {
              urlCall: "http://localhost:8000/transaction/pending",
          })
      })
    socket.on("disconnect", () => {
      console.log(`user with id ${socket.id} disconnected`);
      delete MiningData[socket.id];
    });
  });
}