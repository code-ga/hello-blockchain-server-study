import mongoose from "mongoose";
import { Block } from "../Blockchain/BlockChainClass";
import { TransactionsClass } from "./../Blockchain/BlockChainClass";
import { BlockModel } from "./../../db/BlockModle";
import { PendingTransactionsModel } from "./../../db/PendingTransactionsModel";


export const connectToDB = async (url: string) => {
  await mongoose.connect(url, {});
};

export const getChain = async (): Promise<Block[]> => {
  const blocks = await BlockModel.find();
  const result = blocks.map((blockDB) => {
    const transactions = blockDB.transactions.map((transactionDB) => {
      return new TransactionsClass(
        transactionDB.fromAddress,
        transactionDB.toAddress,
        transactionDB.amount
      );
    });

    const block = new Block(
      transactions,
      blockDB.previousHash,
      blockDB.timestamp
    );
    block.noise = blockDB.noise;
    block.mining();

    return block;
  });
  return result;
};

export const addBlockToChain = async (block: Block) => {
  const transactions: {
    fromAddress: string;
    toAddress: string;
    amount: number;
  }[] = block.transactions.map((transaction) => ({
    fromAddress: transaction.fromAddress,
    toAddress: transaction.toAddress,
    amount: transaction.amount,
  }));
  await new BlockModel({
    transactions,
    previousHash: block.previousHash,
    timestamp: block.timestamp,
    noise: block.noise,
    hash: block.hash,
  }).save();
};

let count = 0;
export const getLastBlock = async (): Promise<Block> => {
  const data = await BlockModel.find();
  if (data.length) {
    const blockDB = data[data.length - 1];
    const transactions = blockDB.transactions.map((transactionDB) => {
      return new TransactionsClass(
        transactionDB.fromAddress,
        transactionDB.toAddress,
        transactionDB.amount
      );
    });
    const block = new Block(
      transactions,
      blockDB.previousHash,
      blockDB.timestamp
    );
    block.noise = blockDB.noise;
    block.mining();
    return block;
  }
};

export const resetDB = async () => {
  await BlockModel.deleteMany({});
  await PendingTransactionsModel.deleteMany({});
};

export const getPendingTransactions = async (): Promise<
  TransactionsClass[]
> => {
  const data = await PendingTransactionsModel.find();
  if (data.length) {
    const transactions = data.map((transactionDB) => {
      return new TransactionsClass(
        transactionDB.fromAddress,
        transactionDB.toAddress,
        transactionDB.amount
      );
    });
    return transactions;
  }
  return [];
};
export const addPendingTransaction = async (
  transaction: TransactionsClass
): Promise<boolean> => {
  await new PendingTransactionsModel({
    fromAddress: transaction.fromAddress,
    toAddress: transaction.toAddress,
    amount: transaction.amount,
  }).save();
  return true;
};
export const setPendingTransactions = async (
  transactions: TransactionsClass[]
): Promise<boolean> => {
  await PendingTransactionsModel.deleteMany({});
  for (const transaction of transactions) {
    await new PendingTransactionsModel({
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      amount: transaction.amount,
    }).save();
  }
  return true;
};
