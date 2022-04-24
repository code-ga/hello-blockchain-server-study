import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import { connectToDB, resetDB } from "./core/util/db";
import KeyRouter from "./router/key";
import UserRouter from "./router/user";
import dotenv from "dotenv";
import path from "path";
import { AppInfoModel } from "./db/appInfoModel";
import TransactionsRouter from "./router/transactions";
import BlockChainRouter from "./router/blockchain";
import { WebSocketServer } from "ws";
import handlersWebSocket from "./util/websocket/handlers";
import { blockchain } from "./util/blockChain";

dotenv.config({
  path: path.join(__dirname, "./.env"),
});

const app = express();
const HttpServer = createServer(app);
const port = process.env.PORT || 8000;
const wss = new WebSocketServer({
  server: HttpServer,
});

handlersWebSocket(wss);

app.use(express.urlencoded({ extended: true }));
app.use(
  morgan(function (tokens, req, res) {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms",
    ].join(" ");
  })
);

const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/";
connectToDB(dbUrl);

// setup route in here ...
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/key", KeyRouter);
app.use("/user", UserRouter);
app.use("/transaction", TransactionsRouter);
app.use("/blockchain", BlockChainRouter);

HttpServer.listen(port, async () => {
  const AppInfo = await AppInfoModel.findOne();
  if (!AppInfo) {
    const appInfo = new AppInfoModel({
      isMining: false,
    });
    await appInfo.save();
  }
  // await resetDB();
  await blockchain.init();
  console.log(`🚀 | Server is running on port ${port} | ✨`);
});

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).send("404 Not Found");
});
// const allAlphabet = [
//   ..."abcdefghijklmnopqrstuvwxyz".toLowerCase(),
//   ..."abcdefghijklmnopqrstuvwxyz".toUpperCase(),
// ];
