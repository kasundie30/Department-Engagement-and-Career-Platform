import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
  conversationId: Types.ObjectId;

  @Prop({ required: true })
  senderId: string; // Auth0 sub

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  readBy: string[]; // Auth0 subs of users who have read this
}

export const MessageSchema = SchemaFactory.createForClass(Message);
