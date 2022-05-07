import {
  addBlockToChain,
  addPendingTransaction,
  connectToDB,
  getChain,
  getLastBlock,
  getPendingTransactions,
  resetDB,
  setPendingTransactions,
} from "./../util/db";
import EventEmitter from "events";
import dotenv from "dotenv";
import path from "path";
import { TransactionsClass } from "./TransactionsClass";
import { BlockClass } from "./BlockClass";
import { generateKeyPair } from "./../util/keygeneraction";
dotenv.config({
  path: path.join(__dirname, "../../.env"),
});

const coinName = "đồng tào lao";

enum errorCodeType {
  InvalidAddress = "InvalidAddress",
  InvalidTransaction = "InvalidTransaction",
  InvalidAmount = "InvalidAmount",
}

interface BlockChainClassEvents {}

export declare interface BlockChainClass {
  on<U extends keyof BlockChainClassEvents>(
    event: U,
    listener: BlockChainClassEvents[U]
  ): this;

  emit<U extends keyof BlockChainClassEvents>(
    event: U,
    ...args: Parameters<BlockChainClassEvents[U]>
  ): boolean;
}

export class BlockChainClass extends EventEmitter {
  constructor(public mongoDbConnectUrl?: string) {
    super();
  }
  async init() {
    if (this.mongoDbConnectUrl) {
      try {
        await connectToDB(this.mongoDbConnectUrl);
      } catch (error) {
        throw new Error("can not connect to mongodb");
      }
    }
    console.log((await getChain()).length);
    if (!(await getChain()).length) {
      await this.createGenesisBlock();
    }
  }
  async createGenesisBlock() {
    const genesisTransaction = new TransactionsClass(
      null,
      "Genesis-Address",
      0,
      Date.now()
    );
    await addPendingTransaction(genesisTransaction);
  }
  getLastBlockClass() {
    return getLastBlock();
  }
  async minePendingTransactions(miningRewardAddress: string) {
    const nowPendingTransactionsLength = (await getPendingTransactions())
      .length;
    if (!(await getPendingTransactions()).length) return;
    for (const i of await getPendingTransactions()) {
      const block = new BlockClass([i]);
      block.previousHash = (await getLastBlock())?.hash || "";
      block.mining();
      await addBlockToChain(block);
      await setPendingTransactions([
        new TransactionsClass(
          null,
          miningRewardAddress,
          nowPendingTransactionsLength * 10,
          Date.now()
        ),
      ]);
    }
  }
  async addTransaction(
    transaction: TransactionsClass,
    errorFunc?: (errorCode: errorCodeType) => any
  ) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      errorFunc && errorFunc(errorCodeType.InvalidAddress);
      return;
    }
    if (!transaction.isValid()) {
      errorFunc && errorFunc(errorCodeType.InvalidTransaction);
      return;
    }
    // if (
    //   transaction.amount <= 0 ||
    //   (await this.getBalanceOfAddress(transaction.fromAddress)) <
    //     transaction.amount
    // ) {
    //   this.emit("error", errorCodeType.InvalidAmount);
    //   return;
    // }
    await addPendingTransaction(transaction);
  }
  async getBalanceOfAddress(address: string) {
    let balance = 0;
    (await getChain()).forEach((block) => {
      block.transactions.forEach((transaction) => {
        if (transaction.fromAddress === address) {
          balance -= transaction.amount;
        }
        if (transaction.toAddress === address) {
          balance += transaction.amount;
        }
      });
    });
    return balance;
  }
  async isValidChain() {
    const chain = await getChain();
    for (let index = 1; index < chain.length; index++) {
      const element = chain[index];
      if (!element.hasValidTransactions()) {
        return false;
      }
      const lashChain = chain[index - 1];
      if (element.hash != element.testBlock()) {
        return false;
      }
      if (element.previousHash !== lashChain.hash) {
        return false;
      }
    }
    return true;
  }
}

// test playground
const testBlock = () => {
  console.time("Hash");
  const genesisBlock = new BlockClass([
    new TransactionsClass("", "", 0, Date.now()),
  ]);
  genesisBlock.mining();
  console.timeEnd("Hash");
};
// testBlock()
const testBlockChain = async () => {
  const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/";
  connectToDB(dbUrl);
  const blockchain = new BlockChainClass();
  resetDB();
  await blockchain.init();
  const myKeyPair = generateKeyPair().keyPair;
  const AnotherKeyPair = generateKeyPair().keyPair;
  const MiningRewardAddress = generateKeyPair().keyPair;
  const tx1 = new TransactionsClass(
    myKeyPair.getPublic("hex"),
    AnotherKeyPair.getPublic("hex"),
    100,
    Date.now()
  );
  tx1.signTransaction(myKeyPair);
  await blockchain.addTransaction(tx1);
  const tx2 = new TransactionsClass(
    AnotherKeyPair.getPublic("hex"),
    myKeyPair.getPublic("hex"),
    50,
    Date.now()
  );
  tx2.signTransaction(AnotherKeyPair);
  await blockchain.addTransaction(tx2);
  await blockchain.minePendingTransactions(
    MiningRewardAddress.getPublic("hex")
  );
  await blockchain.minePendingTransactions(
    MiningRewardAddress.getPublic("hex")
  );

  console.log(
    `Balance of myKeyPair is ${await blockchain.getBalanceOfAddress(
      myKeyPair.getPublic("hex")
    )} ${coinName}`
  );
  console.log(
    `Balance of AnotherKeyPair is ${await blockchain.getBalanceOfAddress(
      AnotherKeyPair.getPublic("hex")
    )} ${coinName}`
  );
  console.log(
    `Balance of MiningRewardAddress is ${await blockchain.getBalanceOfAddress(
      MiningRewardAddress.getPublic("hex")
    )} ${coinName}`
  );
  console.log(`Is blockchain valid? ${await blockchain.isValidChain()}`);
};
// testBlockChain().then(console.log).catch(console.log);
