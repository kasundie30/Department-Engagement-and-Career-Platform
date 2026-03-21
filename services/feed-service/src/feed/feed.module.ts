import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { HttpModule } from '@nestjs/axios'; // Added this import
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { Post, PostSchema } from './schemas/post.schema';
import { Comment, CommentSchema } from './schemas/comment.schema';
import { RedisService } from '../redis/redis.service';
import { R2Service } from '../r2/r2.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
    MulterModule.register({ storage: memoryStorage() }),
    HttpModule, // Added HttpModule to imports
  ],
  controllers: [FeedController],
  providers: [FeedService, RedisService, R2Service],
})
export class FeedModule { }
