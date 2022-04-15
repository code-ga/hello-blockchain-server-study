import { SHA256 } from "crypto-js";
import hashConditions from "../util/hashConditions";
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
dotenv.config({
  path: path.join(__dirname, "../../.env"),
});

export class TransactionsClass {
  constructor(
    public fromAddress: string | null | undefined,
    public toAddress: string | null | undefined,
    public amount: number
  ) {}
}

export class Block {
  public noise: number;
  hash: string;
  constructor(
    public transactions: TransactionsClass[],
    public previousHash = "",
    public timestamp = Date.now(),
    public conditions: (hash: string) => boolean = hashConditions
  ) {
    this.noise = 0;
    this.hash = "";
  }

  private calculateHash() {
    const hashData = this.createHashData();
    const hash = SHA256(hashData);
    return hash;
  }
  public mining() {
    while (!this.conditions(this.hash)) {
      this.noise++;
      this.hash = this.calculateHash().toString();
    }
    return this;
  }
  private createHashData() {
    return `${this.previousHash}|${this.timestamp}|${
      typeof this.transactions == "object"
        ? JSON.stringify(this.transactions)
        : this.transactions
    }|${this.noise}`;
  }
  public testBlock() {
    const hashData = this.createHashData();
    console.log(hashData);
    const hash = SHA256(hashData);
    return hash.toString();
  }
}

enum errorCodeType{

}

interface BlockChainClassEvents {
  error: (errorCode: errorCodeType) => any;
}

declare interface BlockChainClass {
  on<U extends keyof BlockChainClassEvents>(
    event: U,
    listener: BlockChainClassEvents[U]
  ): this;

  emit<U extends keyof BlockChainClassEvents>(
    event: U,
    ...args: Parameters<BlockChainClassEvents[U]>
  ): boolean;
}

class BlockChainClass extends EventEmitter {
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
    if (!(await getChain()).length) {
      await this.createGenesisBlock();
    }
  }
  async createGenesisBlock() {
    const block = new Block([
      new TransactionsClass(null, "Genesis-Address", 0),
    ]);
    block.mining();
    await addBlockToChain(block);
  }
  getLastBlockClass() {
    return getLastBlock();
  }
  async minePendingTransactions(miningRewardAddress: string) {
    const nowPendingTransactionsLength = (await getPendingTransactions())
      .length;
    if (!(await getPendingTransactions()).length) return;
    const block = new Block([...(await getPendingTransactions())]);
    block.previousHash = (await getLastBlock()).hash;
    block.mining();
    await addBlockToChain(block);
    await setPendingTransactions([
      new TransactionsClass(
        null,
        miningRewardAddress,
        nowPendingTransactionsLength
      ),
    ]);
  }
  async createTransaction(transaction: TransactionsClass) {
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
  const genesisBlock = new Block([new TransactionsClass("", "", 0)]);
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
  await blockchain.createTransaction(
    new TransactionsClass("address1", "address2", 100)
  );
  await blockchain.createTransaction(
    new TransactionsClass("address2", "address1", 50)
  );
  await blockchain.minePendingTransactions("test");
  await blockchain.minePendingTransactions("test");

  console.log("test : ", await blockchain.getBalanceOfAddress("test"));
  console.log("address1 :", await blockchain.getBalanceOfAddress("address1"));
  console.log("address2 :", await blockchain.getBalanceOfAddress("address2"));
};
testBlockChain().then(console.log).catch(console.log);
