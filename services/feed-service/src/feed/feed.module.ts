import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { Post, PostSchema } from './schemas/post.schema';
import { RedisService } from '../redis/redis.service';
import { R2Service } from '../r2/r2.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [FeedController],
  providers: [FeedService, RedisService, R2Service],
})
export class FeedModule { }
