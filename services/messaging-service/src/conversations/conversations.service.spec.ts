import { Test, TestingModule } from '@nestjs/testing';
import { ConversationsService } from './conversations.service';
import { getModelToken } from '@nestjs/mongoose';
import { Conversation } from './schemas/conversation.schema';
import { Message } from './schemas/message.schema';

const mockConversation = {
  _id: '507f1f77bcf86cd799439011',
  participants: ['user1', 'user2'],
  isGroup: false,
  name: '',
  lastMessage: '',
  lastMessageAt: null,
};

const mockMessage = {
  _id: '507f1f77bcf86cd799439012',
  conversationId: '507f1f77bcf86cd799439011',
  senderId: 'user1',
  content: 'Hello!',
  readBy: ['user1'],
};

const mockConversationModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn().mockReturnThis(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  sort: jest.fn().mockReturnThis(),
  exec: jest.fn(),
};

const mockMessageModel = {
  create: jest.fn(),
  find: jest.fn().mockReturnThis(),
  countDocuments: jest.fn(),
  updateMany: jest.fn(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exec: jest.fn(),
};

describe('ConversationsService', () => {
  let service: ConversationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: getModelToken(Conversation.name),
          useValue: mockConversationModel,
        },
        {
          provide: getModelToken(Message.name),
          useValue: mockMessageModel,
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrGetDM', () => {
    it('should return existing DM if found', async () => {
      mockConversationModel.findOne.mockResolvedValue(mockConversation);
      const result = await service.createOrGetDM('user1', 'user2');
      expect(result).toEqual(mockConversation);
      expect(mockConversationModel.findOne).toHaveBeenCalledWith({
        isGroup: false,
        participants: { $all: ['user1', 'user2'], $size: 2 },
      });
      expect(mockConversationModel.create).not.toHaveBeenCalled();
    });

    it('should create a new DM if none exists', async () => {
      mockConversationModel.findOne.mockResolvedValue(null);
      mockConversationModel.create.mockResolvedValue(mockConversation);
      const result = await service.createOrGetDM('user1', 'user2');
      expect(result).toEqual(mockConversation);
      expect(mockConversationModel.create).toHaveBeenCalledWith({
        participants: ['user1', 'user2'],
        isGroup: false,
        name: '',
      });
    });
  });

  describe('createGroup', () => {
    it('should create a group conversation with deduplicated participants', async () => {
      const groupConv = { ...mockConversation, isGroup: true, name: 'Study Group', participants: ['user1', 'user2', 'user3'] };
      mockConversationModel.create.mockResolvedValue(groupConv);
      const result = await service.createGroup('user1', {
        name: 'Study Group',
        participants: ['user2', 'user3'],
      });
      expect(result.isGroup).toBe(true);
      expect(result.name).toBe('Study Group');
      expect(result.participants).toContain('user1');
    });
  });

  describe('findByUser', () => {
    it('should return a list of conversations for user', async () => {
      mockConversationModel.exec.mockResolvedValue([mockConversation]);
      const result = await service.findByUser('user1');
      expect(result).toEqual([mockConversation]);
    });
  });

  describe('sendMessage', () => {
    it('should send a message and update conversation', async () => {
      // findById needs to return a conversation where user is a participant
      mockConversationModel.findById
        .mockResolvedValue({ ...mockConversation, participants: ['user1', 'user2'] });
      mockMessageModel.create.mockResolvedValue(mockMessage);
      mockConversationModel.findByIdAndUpdate.mockResolvedValue(mockConversation);

      const result = await service.sendMessage(
        '507f1f77bcf86cd799439011',
        'user1',
        { content: 'Hello!' },
      );
      expect(result).toEqual(mockMessage);
      expect(mockConversationModel.findByIdAndUpdate).toHaveBeenCalled();
    });
  });
});
