import { Router } from "express";
import { TransactionsClass } from "../core/Blockchain/TransactionsClass";
import { blockchain } from "../util/blockChain";

const UserRouter = Router();
import { ec as EC } from "elliptic";
var ec = new EC("secp256k1");

UserRouter.post("/user-money", async (req, res) => {
  const userId = req.body.userId;
  const userMoney = await blockchain.getBalanceOfAddress(userId);
  res.json({
    userMoney,
  });
});



export default UserRouter;
