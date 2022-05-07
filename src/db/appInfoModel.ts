import { getModelForClass, prop } from "@typegoose/typegoose";

class AppInfoClass {
  @prop({ required: true, default: false })
  isMining: boolean;
}

export const AppInfoModel = getModelForClass(AppInfoClass);
