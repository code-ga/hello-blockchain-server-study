import { SHA256 } from "crypto-js";
import hashConditions from "./hashConditions";
import { TransactionsClass } from "./TransactionsClass";

export class BlockClass {
  public noise: number;
  hash: string;
  constructor(
    public transactions: TransactionsClass[],
    public previousHash = "",
    public timestamp = Date.now(),
    public conditions: (hash: string) => boolean = hashConditions(5)
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
      console.log(this.hash);
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
  hasValidTransactions() {
    for (const transaction of this.transactions) {
      if (!transaction.isValid()) {
        return false;
      }
    }
    return true;
  }
}
