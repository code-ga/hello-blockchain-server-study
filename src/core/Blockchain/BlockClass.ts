import { SHA256 } from "crypto-js";
import { hashLevel } from "../../env";
import hashConditions from "../util/hashConditions";
import { TransactionsClass } from "./TransactionsClass";
import { IMetadata } from "../../db/BlockModel";

export class BlockClass {
  public noise: number;
  hash: string;
  constructor(
    public transactions: TransactionsClass[],
    public previousHash = "",
    public timestamp = Date.now(),
    public Metadata: IMetadata,
    public conditions: (hash: string) => boolean = hashConditions(hashLevel)
  ) {
    this.noise = 0;
    this.hash = "";
    this.timestamp = this.transactions[0].timestamp;
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
    }|${this.noise}|${
      typeof this.Metadata == "object"
        ? JSON.stringify(this.Metadata)
        : this.Metadata
    }`;
  }
  public testBlock() {
    const hashData = this.createHashData();
    const hash = SHA256(hashData);
    this.hash = hash.toString();
    return hash.toString();
  }
  hasValidTransactions() {
    for (const transaction of this.transactions) {
      if (!transaction.isValid()) {
        return false;
      }
    }
    return true;
  }
}
