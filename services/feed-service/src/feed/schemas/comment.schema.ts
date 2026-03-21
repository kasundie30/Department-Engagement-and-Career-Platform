import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true, index: true })
  postId: Types.ObjectId;

  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, minlength: 1 })
  content: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
