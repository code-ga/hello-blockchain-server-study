import { Router } from "express";
import { TransactionsClass } from "../core/Blockchain/TransactionsClass";
import { blockchain } from "../util/blockChain";

const TransactionsRouter = Router();
import { ec as EC } from "elliptic";
import { getLastBlock, getPendingTransactions } from "../core/util/db";
import { BlockClass } from "./../core/Blockchain/BlockClass";
var ec = new EC("secp256k1");

TransactionsRouter.post("/create", async (req, res) => {
  const fromAddress = ec.keyFromPrivate(req.body.fromAddress);
  const toAddress = req.body.toAddress;
  const amount = req.body.amount;
  const tx = new TransactionsClass(
    fromAddress.getPublic("hex"),
    toAddress,
    amount,
    Date.now()
  );
  console.log(req.body, fromAddress, toAddress, amount);
  tx.signTransaction(fromAddress, (err) => {
    res.json({
      message: err,
      success: false,
    });
  });
  await blockchain.addTransaction(tx, (errorCode) => {
    res.json({
      errorCode,
      success: false,
    });
  });
  res.json({
    tx,
  });
});

TransactionsRouter.get("/pending", async (req, res) => {
  const data = [...(await getPendingTransactions())];
  const block = new BlockClass(
    data,
    (await (await getLastBlock())?.hash) || ""
  );
  if (!block.hasValidTransactions()) {
    res.json({
      data: data.slice(1),
    });
    return;
  }
  res.json({
    data: [data[0]],
  });
});

export default TransactionsRouter;
