import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  STUDENT = 'student',
  ALUMNI = 'alumni',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, sparse: true })
  auth0Id: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.STUDENT,
    index: true,
  })
  role: UserRole;

  @Prop({ default: '' })
  bio: string;

  @Prop({ default: '' })
  department: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ type: Date, default: Date.now, index: true })
  lastActiveAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
