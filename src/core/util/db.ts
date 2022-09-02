import mongoose from "mongoose";
import { BlockClass } from "../Blockchain/BlockClass";
import { TransactionsClass } from "../Blockchain/TransactionsClass";
import { BlockModel } from "../../db/BlockModel";
import { PendingTransactionsModel } from "./../../db/PendingTransactionsModel";

export const connectToDB = async (url: string) => {
  await mongoose.connect(url, {});
};

export const getChain = async (): Promise<BlockClass[]> => {
  const blocks = await BlockModel.find();
  const result = blocks.map((blockDB) => {
    const transactions = blockDB.transactions.map((transactionDB) => {
      const Transactions = new TransactionsClass(
        transactionDB.fromAddress,
        transactionDB.toAddress,
        transactionDB.amount,
        transactionDB.timestamp
      );
      if (transactionDB.signature) {
        Transactions.signature = transactionDB.signature;
      }
      return Transactions;
    });

    const block = new BlockClass(
      transactions,
      blockDB.previousHash,
      blockDB.timestamp,
      {
        MinerPublicKey: blockDB.MinerPublicKey,
        nodeId: blockDB.nodeId,
      }
    );
    block.noise = blockDB.noise;
    block.mining();
    return block;
  });
  return result;
};

export const addBlockToChain = async (block: BlockClass) => {
  const transactions: {
    fromAddress: string;
    toAddress: string;
    amount: number;
    signature: string;
    timestamp: number;
  }[] = block.transactions.map((transaction) => ({
    fromAddress: transaction.fromAddress,
    toAddress: transaction.toAddress,
    amount: transaction.amount,
    signature: transaction.signature,
    timestamp: transaction.timestamp,
  }));
  await new BlockModel({
    transactions,
    previousHash: block.previousHash,
    timestamp: block.timestamp,
    noise: block.noise,
    hash: block.hash,
    MinerPublicKey: block.Metadata.MinerPublicKey,
    nodeId: block.Metadata.nodeId,
  }).save();
};

export const getLastBlock = async (): Promise<
  BlockClass | undefined | null
> => {
  let data = await BlockModel.find();
  if (data.length) {
    const blockDB = data[data.length - 1];
    const transactions = blockDB.transactions.map((transactionDB) => {
      const Transactions = new TransactionsClass(
        transactionDB.fromAddress,
        transactionDB.toAddress,
        transactionDB.amount,
        transactionDB.timestamp
      );
      if (transactionDB.signature) {
        Transactions.signature = transactionDB.signature;
      }
      return Transactions;
    });
    const block = new BlockClass(
      transactions,
      blockDB.previousHash,
      blockDB.timestamp,
      {
        MinerPublicKey: blockDB.MinerPublicKey,
        nodeId: blockDB.nodeId,
      }
    );
    block.noise = blockDB.noise;
    block.mining();
    return block;
  }
  return null;
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
      const Transactions = new TransactionsClass(
        transactionDB.fromAddress,
        transactionDB.toAddress,
        transactionDB.amount,
        transactionDB.timestamp
      );
      if (transactionDB.signature) {
        Transactions.signature = transactionDB.signature;
      }
      return Transactions;
    });
    return transactions;
  }
  return [];
};
export const addPendingTransaction = async (
  transaction: TransactionsClass
): Promise<boolean> => {
  const baseTransaction = {
    fromAddress: transaction.fromAddress,
    toAddress: transaction.toAddress,
    amount: transaction.amount,
    timestamp: transaction.timestamp,
  };
  await new PendingTransactionsModel(
    transaction.fromAddress
      ? {
          ...baseTransaction,
          signature: transaction.signature,
        }
      : {
          ...baseTransaction,
        }
  ).save();
  return true;
};
export const setPendingTransactions = async (
  transactions: TransactionsClass[]
): Promise<boolean> => {
  await PendingTransactionsModel.deleteMany({});
  for (const transaction of transactions) {
    await new PendingTransactionsModel(
      transaction.fromAddress
        ? {
            fromAddress: transaction.fromAddress,
            toAddress: transaction.toAddress,
            amount: transaction.amount,
            signature: transaction.signature,
            timestamp: transaction.timestamp,
          }
        : {
            fromAddress: transaction.fromAddress,
            toAddress: transaction.toAddress,
            amount: transaction.amount,
            timestamp: transaction.timestamp,
          }
    ).save();
  }
  return true;
};
export const deleteFirstPendingTransaction = async (): Promise<boolean> => {
  await PendingTransactionsModel.deleteOne({});
  return true;
};
