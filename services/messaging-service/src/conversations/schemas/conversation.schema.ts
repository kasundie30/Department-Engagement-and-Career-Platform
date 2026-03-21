import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: [String], required: true, index: true })
  participants: string[]; // Auth0 sub IDs

  @Prop({ default: false })
  isGroup: boolean;

  @Prop({ default: '' })
  name: string; // Only used for group conversations

  @Prop({ default: '' })
  lastMessage: string;

  @Prop({ default: null })
  lastMessageAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Compound index for fast DM lookup (find conversation between two users)
ConversationSchema.index({ participants: 1 });
