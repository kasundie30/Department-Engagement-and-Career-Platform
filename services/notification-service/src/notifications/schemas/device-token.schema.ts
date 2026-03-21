import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeviceTokenDocument = DeviceToken & Document;

export enum TokenType {
  FCM = 'FCM',
  EXPO = 'EXPO',
}

@Schema({ timestamps: true })
export class DeviceToken {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true, enum: TokenType })
  type: TokenType;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);

DeviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });
