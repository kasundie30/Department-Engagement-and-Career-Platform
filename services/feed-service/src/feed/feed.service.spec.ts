import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from './feed.service';
import { getModelToken } from '@nestjs/mongoose';
import { Post } from './schemas/post.schema';
import { RedisService } from '../redis/redis.service';
import { R2Service } from '../r2/r2.service';
import { NotFoundException } from '@nestjs/common';

const mockPostModel = {
  create: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn().mockResolvedValue([]),
};

const mockR2 = {
  uploadFile: jest.fn(),
  statObject: jest.fn(),
};

describe('FeedService', () => {
  let service: FeedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        { provide: getModelToken(Post.name), useValue: mockPostModel },
        { provide: RedisService, useValue: mockRedis },
        { provide: R2Service, useValue: mockR2 },
      ],
    }).compile();
    service = module.get<FeedService>(FeedService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a post and invalidate cache', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const fakePost = { _id: fakeId, content: 'hello', userId: fakeId };
      mockPostModel.create.mockResolvedValue(fakePost);
      mockRedis.keys.mockResolvedValue(['feed:page:1']);
      const result = await service.create(fakeId, { content: 'hello' });
      expect(result).toHaveProperty('content', 'hello');
      expect(mockRedis.keys).toHaveBeenCalledWith('feed:page:*');
      expect(mockRedis.del).toHaveBeenCalledWith('feed:page:1');
    });
  });

  describe('getFeed', () => {
    it('should return cached result on cache hit', async () => {
      const cached = JSON.stringify([{ content: 'cached' }]);
      mockRedis.get.mockResolvedValue(cached);
      const result = await service.getFeed(1, 10);
      expect(result[0]).toHaveProperty('content', 'cached');
      expect(mockPostModel.find).not.toHaveBeenCalled();
    });

    it('should query DB on cache miss and store result in cache', async () => {
      mockRedis.get.mockResolvedValue(null);
      const fakeExec = jest.fn().mockResolvedValue([{ content: 'db-post' }]);
      mockPostModel.find.mockReturnValue({
        sort: () => ({ skip: () => ({ limit: () => ({ exec: fakeExec }) }) }),
      });
      const result = await service.getFeed(1, 10);
      expect(result[0]).toHaveProperty('content', 'db-post');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'feed:page:1',
        expect.any(String),
        60,
      );
    });
  });

  describe('likePost', () => {
    it('should add like to post', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      mockPostModel.findByIdAndUpdate.mockResolvedValue({ likes: [fakeId] });
      const result = await service.likePost(fakeId, fakeId);
      expect(result.likes).toContain(fakeId);
    });

    it('should throw NotFoundException if post not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      mockPostModel.findByIdAndUpdate.mockResolvedValue(null);
      await expect(service.likePost(fakeId, fakeId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('uploadImage', () => {
    it('should call r2 uploadFile and return url', async () => {
      mockR2.uploadFile.mockResolvedValue(
        'https://r2.example.com/posts/test.jpg',
      );
      const url = await service.uploadImage(Buffer.from(''), 'image/jpeg');
      expect(mockR2.uploadFile).toHaveBeenCalledWith(
        Buffer.from(''),
        'image/jpeg',
      );
      expect(url).toContain('.jpg');
    });
  });
});
