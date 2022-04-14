import { getModelForClass, prop } from "@typegoose/typegoose";

class PendingTransactionsClass {
  @prop({ nullable: true })
  public fromAddress?: string | null;

  @prop({ nullable: true })
  public toAddress?: string | null;

  @prop({ required: true, nullable: true })
  public amount: number;
}

export const PendingTransactionsModel = getModelForClass(
  PendingTransactionsClass
);
