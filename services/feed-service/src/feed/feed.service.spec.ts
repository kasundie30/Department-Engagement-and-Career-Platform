import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from './feed.service';
import { getModelToken } from '@nestjs/mongoose';
import { Post } from './schemas/post.schema';
import { Comment } from './schemas/comment.schema';
import { RedisService } from '../redis/redis.service';
import { R2Service } from '../r2/r2.service';
import { NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

const mockPostModel = {
  create: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
};

const mockCommentModel = {
  create: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
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
  
  const mockHttpService = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockHttpService.post.mockReturnValue(of({ status: 200, data: {} }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        { provide: getModelToken(Post.name), useValue: mockPostModel },
        { provide: getModelToken(Comment.name), useValue: mockCommentModel },
        { provide: RedisService, useValue: mockRedis },
        { provide: R2Service, useValue: mockR2 },
        { provide: HttpService, useValue: mockHttpService },
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
      const result = await service.create(fakeId, 'student', { content: 'hello' });
      expect(result).toHaveProperty('content', 'hello');
      expect(mockRedis.keys).toHaveBeenCalledWith('feed:page:*');
      expect(mockRedis.del).toHaveBeenCalledWith('feed:page:1');
    });
  });

  describe('getFeed', () => {
    it('should return cached result on cache hit', async () => {
      const cached = JSON.stringify({ items: [{ content: 'cached' }], meta: { totalPages: 1, page: 1 } });
      mockRedis.get.mockResolvedValue(cached);
      const result = await service.getFeed(1, 10, undefined);
      expect(result.items[0]).toHaveProperty('content', 'cached');
      expect(mockPostModel.find).not.toHaveBeenCalled();
    });

    it('should query DB on cache miss and store result in cache', async () => {
      mockRedis.get.mockResolvedValue(null);
      const fakeExec = jest.fn().mockResolvedValue([{ content: 'db-post' }]);
      mockPostModel.find.mockReturnValue({
        sort: () => ({ skip: () => ({ limit: () => ({ exec: fakeExec }) }) }),
      });
      mockPostModel.countDocuments.mockResolvedValue(1);
      const result = await service.getFeed(1, 10, undefined);
      expect(result.items[0]).toHaveProperty('content', 'db-post');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'feed:page:1:limit:10:role:all',
        expect.any(String),
        60,
      );
    });
  });

  describe('likePost', () => {
    it('should add like to post', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      mockPostModel.findByIdAndUpdate.mockResolvedValue({ likes: [fakeId], userId: 'authorId' });
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

  describe('addComment', () => {
    it('should create a comment and increment post commentCount', async () => {
      const postId = '507f1f77bcf86cd799439011';
      mockCommentModel.create.mockResolvedValue({ content: 'Test comment' });
      mockPostModel.findByIdAndUpdate.mockResolvedValue({ _id: postId, userId: 'user1' });
      mockRedis.keys.mockResolvedValue(['feed:page:1']);
      
      const result = await service.addComment(postId, 'user2', { content: 'Test comment' });
      
      expect(result).toHaveProperty('content', 'Test comment');
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalledWith('feed:page:1');
      expect(mockHttpService.post).toHaveBeenCalled();
    });
  });

  describe('getComments', () => {
    it('should return paginated comments', async () => {
      const postId = '507f1f77bcf86cd799439011';
      const fakeExec = jest.fn().mockResolvedValue([{ content: 'comment1' }]);
      mockCommentModel.find.mockReturnValue({
        sort: () => ({ skip: () => ({ limit: () => ({ exec: fakeExec }) }) }),
      });
      mockCommentModel.countDocuments.mockResolvedValue(1);

      const result = await service.getComments(postId, 1, 10);
      expect(result.items[0]).toHaveProperty('content', 'comment1');
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
