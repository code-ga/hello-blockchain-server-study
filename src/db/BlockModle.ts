import { getModelForClass, prop } from "@typegoose/typegoose";

class BlockClass {
  @prop({ required: true, default: [] })
  public transactions: {
    fromAddress: string;
    toAddress: string;
    amount: number;
  }[];
  @prop()
  previousHash: string;
  @prop({ required: true })
  timestamp: number;
  @prop({ required: true })
  noise: number;
  @prop({ required: true })
  hash: string;
}

export const BlockModel = getModelForClass(BlockClass);
