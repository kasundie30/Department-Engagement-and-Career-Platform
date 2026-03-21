import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreatePostDto, CreateCommentDto } from './dto/post.dto';
import { RedisService } from '../redis/redis.service';
import { R2Service } from '../r2/r2.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const FEED_CACHE_TTL = 60; // seconds

@Injectable()
export class FeedService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private readonly redis: RedisService,
    private readonly r2: R2Service,
    private readonly httpService: HttpService,
  ) { }

  async create(userId: string, role: string, dto: CreatePostDto): Promise<PostDocument> {
    const post = await this.postModel.create({
      userId: userId,
      authorRole: role || 'student',
      content: dto.content,
      imageUrl: dto.imageUrl || '',
    });
    // Invalidate feed cache on new post
    const keys = await this.redis.keys('feed:page:*');
    await Promise.all(keys.map((k) => this.redis.del(k)));
    return post;
  }

  // G9.1: Single-post retrieval
  async findById(id: string): Promise<PostDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Post not found');
    const post = await this.postModel.findById(id).exec();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async getFeed(page: number, limit: number, role?: string): Promise<{ items: PostDocument[], meta: { totalPages: number, page: number } }> {
    const cacheKey = `feed:page:${page}:limit:${limit}:role:${role || 'all'}`;

    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // DB query
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {};
    if (role) {
      filter.authorRole = role;
    }

    const [items, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const result = { items, meta: { totalPages, page } };

    // Store in cache
    await this.redis.set(cacheKey, JSON.stringify(result), FEED_CACHE_TTL);
    return result;
  }

  async likePost(postId: string, userId: string, authHeader?: string): Promise<PostDocument> {
    const userObjId = userId;
    const post = await this.postModel.findByIdAndUpdate(
      postId,
      { $addToSet: { likes: userObjId } },
      { new: true },
    );
    if (!post) throw new NotFoundException('Post not found');
    await this.redis
      .keys('feed:page:*')
      .then((keys) => Promise.all(keys.map((k) => this.redis.del(k))));

    if (userId !== post.userId?.toString()) {
      const internalToken = process.env.INTERNAL_TOKEN || 'miniproject-internal-auth-token';
      firstValueFrom(
        this.httpService.post(`${process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006"}/api/v1/internal/notifications/notify`, {
          userId: post.userId.toString(),
          type: 'post_liked',
          message: `User ${userId} liked your post`,
          idempotencyKey: `post_liked:${postId}:${userId}`,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'x-internal-token': internalToken,
          }
        })
      ).then(res => {
        console.log(`[DEBUG] HTTP Internal Notification responded with status: ${res.status}`);
      }).catch(err => console.error('[DEBUG] Failed to send internal notification:', err?.message));
    }

    return post;
  }

  async unlikePost(postId: string, userId: string): Promise<PostDocument> {
    const userObjId = userId;
    const post = await this.postModel.findByIdAndUpdate(
      postId,
      { $pull: { likes: userObjId } },
      { new: true },
    );
    if (!post) throw new NotFoundException('Post not found');
    await this.redis
      .keys('feed:page:*')
      .then((keys) => Promise.all(keys.map((k) => this.redis.del(k))));
    return post;
  }

  async sharePost(postId: string): Promise<PostDocument> {
    const post = await this.postModel.findByIdAndUpdate(
      postId,
      { $inc: { shareCount: 1 } },
      { new: true },
    );
    if (!post) throw new NotFoundException('Post not found');
    await this.redis
      .keys('feed:page:*')
      .then((keys) => Promise.all(keys.map((k) => this.redis.del(k))));
    return post;
  }

  async addComment(postId: string, userId: string, dto: CreateCommentDto): Promise<CommentDocument> {
    if (!Types.ObjectId.isValid(postId)) throw new NotFoundException('Post not found');
    const postObjId = new Types.ObjectId(postId);
    
    // Create comment
    const comment = await this.commentModel.create({
      postId: postObjId,
      userId,
      content: dto.content,
    });

    // Increment comment count
    const post = await this.postModel.findByIdAndUpdate(
      postId,
      { $inc: { commentCount: 1 } },
      { new: true }
    );
    if (!post) throw new NotFoundException('Post not found');

    // Invalidate feed cache
    await this.redis
      .keys('feed:page:*')
      .then((keys) => Promise.all(keys.map((k) => this.redis.del(k))));

    if (userId !== post.userId?.toString()) {
      const internalToken = process.env.INTERNAL_TOKEN || 'miniproject-internal-auth-token';
      firstValueFrom(
        this.httpService.post(`${process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006"}/api/v1/internal/notifications/notify`, {
          userId: post.userId.toString(),
          type: 'post_commented',
          message: `User ${userId} commented on your post`,
          idempotencyKey: `post_commented:${postId}:${comment._id}`,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'x-internal-token': internalToken,
          }
        })
      ).then(res => {
        console.log(`[DEBUG] HTTP Internal Notification responded with status: ${res.status}`);
      }).catch(err => console.error('[DEBUG] Failed to send internal notification:', err?.message));
    }

    return comment;
  }

  async getComments(postId: string, page: number, limit: number): Promise<{ items: CommentDocument[], meta: { totalPages: number, page: number } }> {
    if (!Types.ObjectId.isValid(postId)) throw new NotFoundException('Post not found');
    const postObjId = new Types.ObjectId(postId);

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.commentModel
        .find({ postId: postObjId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.commentModel.countDocuments({ postId: postObjId }),
    ]);

    return {
      items,
      meta: { totalPages: Math.ceil(total / limit) || 1, page },
    };
  }

  async deletePost(postId: string, userId: string, userRole: string): Promise<void> {
    const post = await this.findById(postId);
    if (post.userId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You can only delete your own posts');
    }
    await this.postModel.findByIdAndDelete(postId);
    await this.commentModel.deleteMany({ postId: new Types.ObjectId(postId) });
    const keys = await this.redis.keys('feed:page:*');
    await Promise.all(keys.map((k) => this.redis.del(k)));
  }

  async uploadImage(buffer: Buffer, mimetype: string): Promise<string> {
    return this.r2.uploadFile(buffer, mimetype);
  }

  // G2.1: Verify an R2 object exists by its path within the bucket
  async verifyImage(objectPath: string): Promise<{ exists: boolean; size: number; contentType: string }> {
    return this.r2.statObject(objectPath);
  }
}

