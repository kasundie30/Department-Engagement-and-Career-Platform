import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateGroupDto, SendMessageDto } from './dto/messaging.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
  ) {}

  /** Create or retrieve an existing DM conversation between two users */
  async createOrGetDM(
    userId: string,
    targetUserId: string,
  ): Promise<ConversationDocument> {
    // Look for an existing non-group conversation with exactly these two participants
    const existing = await this.conversationModel.findOne({
      isGroup: false,
      participants: { $all: [userId, targetUserId], $size: 2 },
    });
    if (existing) return existing;

    return this.conversationModel.create({
      participants: [userId, targetUserId],
      isGroup: false,
      name: '',
    });
  }

  /** Create a new group conversation */
  async createGroup(
    userId: string,
    dto: CreateGroupDto,
  ): Promise<ConversationDocument> {
    const allParticipants = Array.from(
      new Set([userId, ...dto.participants]),
    );
    return this.conversationModel.create({
      participants: allParticipants,
      isGroup: true,
      name: dto.name,
    });
  }

  /** List all conversations that a user is part of */
  async findByUser(userId: string): Promise<ConversationDocument[]> {
    return this.conversationModel
      .find({ participants: userId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .exec();
  }

  /** Get a specific conversation (verify user is a participant) */
  async findById(
    conversationId: string,
    userId: string,
  ): Promise<ConversationDocument> {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new NotFoundException('Conversation not found');
    }
    const conv = await this.conversationModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!conv.participants.includes(userId)) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }
    return conv;
  }

  /** Send a message inside a conversation and return it */
  async sendMessage(
    conversationId: string,
    senderId: string,
    dto: SendMessageDto,
  ): Promise<MessageDocument> {
    // Verify sender is a participant
    await this.findById(conversationId, senderId);

    const message = await this.messageModel.create({
      conversationId: new Types.ObjectId(conversationId),
      senderId,
      content: dto.content,
      readBy: [senderId],
    });

    // Update conversation's lastMessage snapshot
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: dto.content,
      lastMessageAt: new Date(),
    });

    return message;
  }

  /** Get paginated messages for a conversation */
  async getMessages(
    conversationId: string,
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: MessageDocument[]; meta: { page: number; totalPages: number } }> {
    await this.findById(conversationId, userId);

    const skip = (page - 1) * limit;
    const convObjId = new Types.ObjectId(conversationId);

    const [items, total] = await Promise.all([
      this.messageModel
        .find({ conversationId: convObjId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel.countDocuments({ conversationId: convObjId }),
    ]);

    return {
      items: items.reverse(), // Return chronological order
      meta: { page, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  /** Mark all messages in a conversation as read by a user */
  async markRead(conversationId: string, userId: string): Promise<void> {
    await this.findById(conversationId, userId);
    const convObjId = new Types.ObjectId(conversationId);
    await this.messageModel.updateMany(
      { conversationId: convObjId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } },
    );
  }
}
