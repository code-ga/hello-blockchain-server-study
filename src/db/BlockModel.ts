import { getModelForClass, prop } from "@typegoose/typegoose";

class BlockClass {
  @prop({ required: true, default: [] })
  public transactions: {
    fromAddress: string;
    toAddress: string;
    amount: number;
    signature?: string;
    timestamp: number;
  }[];
  @prop()
  previousHash: string;
  @prop({ required: true })
  timestamp: number;
  @prop({ required: true })
  noise: number;
  @prop({ required: true })
  hash: string;

  @prop({ required: true })
  MinerPublicKey: string;
  @prop({ required: true })
  nodeId: string;
}

export interface IMetadata {
  MinerPublicKey: string;
  nodeId: string;
}

export const BlockModel = getModelForClass(BlockClass);
