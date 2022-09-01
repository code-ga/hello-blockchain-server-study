import { SHA256 } from "crypto-js";
import EventEmitter from "events";
import { ec as EC } from "elliptic";

interface TransactionsClassEvents {
  SignTransactionError: (errorCode: string) => any;
  InvalidTransaction: (errorCode: string) => any;
}

export declare interface TransactionsClass {
  on<U extends keyof TransactionsClassEvents>(
    event: U,
    listener: TransactionsClassEvents[U]
  ): this;

  emit<U extends keyof TransactionsClassEvents>(
    event: U,
    ...args: Parameters<TransactionsClassEvents[U]>
  ): boolean;
}
var ec = new EC("secp256k1");

export class TransactionsClass extends EventEmitter {
  public signature?: string;
  constructor(
    public fromAddress: string | null | undefined,
    public toAddress: string | null | undefined,
    public amount: number,
    public timestamp: number // = Date.now()
  ) {
    super();
  }
  calculateHash() {
    const hash = SHA256(`${this.fromAddress}${this.toAddress}${this.amount}`);

    return hash.toString();
  }
  signTransaction(signingKey: EC.KeyPair, errorFunction?: (errorCode: string) => any) {
    if (signingKey.getPublic("hex") !== this.fromAddress) {
      this.emit(
        "SignTransactionError",
        "You cannot sign transactions for other wallets!"
      );
      errorFunction && errorFunction("You cannot sign transactions for other wallets!");
      return false;
    }
    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, "base64");
    this.signature = sig.toDER("hex");
    return true;
  }
  isValid() {
    if (this.fromAddress === undefined || this.fromAddress == null) return true;
    if (!this.signature || this.signature.length === 0) {
      this.emit("InvalidTransaction", "No signature in this transaction");
      return false;
    }
    const publicKey = ec.keyFromPublic(this.fromAddress, "hex");
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}
