import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/notification.dto';
import { withRetry } from '../common/retry.util';
import { DeviceToken, DeviceTokenDocument, TokenType } from './schemas/device-token.schema';
import * as admin from 'firebase-admin';
import { Expo } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private expo: Expo;

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(DeviceToken.name)
    private deviceTokenModel: Model<DeviceTokenDocument>,
  ) {
    this.expo = new Expo();
    if (!admin.apps.length) {
      try {
        admin.initializeApp();
        this.logger.log('Firebase Admin initialized successfully');
      } catch (err) {
        this.logger.warn('Firebase Admin could not be initialized, push notifications will fail if not using Expo: ' + err.message);
      }
    }
  }

  async registerToken(userId: string, token: string, type: TokenType): Promise<void> {
    await this.deviceTokenModel.findOneAndUpdate(
      { userId, token },
      { userId, token, type },
      { upsert: true, new: true }
    );
  }

  /**
   * Send a push notification asynchronously to all registered devices of the user.
   */
  private async sendPushNotification(userId: string, title: string, body: string, data: any) {
    try {
      const tokens = await this.deviceTokenModel.find({ userId });
      if (!tokens.length) return;

      const fcmTokens = tokens.filter((t) => t.type === TokenType.FCM).map((t) => t.token);
      const expoTokens = tokens.filter((t) => t.type === TokenType.EXPO).map((t) => t.token);

      // Send via Firebase Cloud Messaging
      if (fcmTokens.length > 0 && admin.apps.length) {
        await admin.messaging().sendEachForMulticast({
          tokens: fcmTokens,
          notification: { title, body },
          data: { ...data, screen: data?.screen || 'Home' },
        });
      }

      // Send via Expo Push Notifications
      if (expoTokens.length > 0) {
        const messages = expoTokens.map(token => ({
          to: token,
          sound: 'default' as any,
          title,
          body,
          data,
        }));
        const chunks = this.expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          try {
            await this.expo.sendPushNotificationsAsync(chunk);
          } catch (error) {
            this.logger.error('Error sending Expo push chunk', error);
          }
        }
      }
    } catch (e) {
      this.logger.error('Failed to send push notifications', e);
    }
  }

  /**
   * Create a notification with idempotency enforcement.
   * If an identical idempotencyKey already exists, silently returns the existing
   * notification (no duplicate, no error thrown to caller).
   */
  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    return withRetry(
      async () => {
        // Check idempotency first
        const existing = await this.notificationModel.findOne({
          idempotencyKey: dto.idempotencyKey,
        });
        if (existing) {
          this.logger.debug(
            `Duplicate notification skipped [key=${dto.idempotencyKey}]`,
          );
          return existing;
        }

        const notification = await this.notificationModel.create({
          userId: dto.userId,
          type: dto.type,
          message: dto.message,
          idempotencyKey: dto.idempotencyKey,
          metadata: dto.metadata ?? {},
        });

        const title = this.getNotificationTitle(dto.type);
        this.sendPushNotification(dto.userId, title, dto.message, { type: dto.type, metadata: dto.metadata });

        return notification;
      },
      3, // maxRetries
      100, // baseDelayMs (short for in-service calls)
    );
  }

  /**
   * Get all notifications for a user, newest first.
   * Optionally filter by unread only.
   */
  async findForUser(
    userId: string,
    unreadOnly = false,
  ): Promise<NotificationDocument[]> {
    const filter: Record<string, unknown> = {
      userId: userId,
    };
    if (unreadOnly) filter.read = false;
    return this.notificationModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  /** Count all unread notifications for a user. */
  async countUnread(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: userId,
      read: false,
    });
  }

  /** Mark a single notification as read. */
  async markRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationDocument | null> {
    const updated = await this.notificationModel.findOneAndUpdate(
      { _id: notificationId, userId: userId },
      { $set: { read: true } },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Notification not found or unauthorized');
    }
    return updated;
  }

  /** Mark all notifications for a user as read. */
  async markAllRead(userId: string): Promise<{ modified: number }> {
    const result = await this.notificationModel.updateMany(
      { userId: userId, read: false },
      { $set: { read: true } },
    );
    return { modified: result.modifiedCount };
  }

  /** Internal: create a notification from an event (used by listener). */
  async createFromEvent(
    userId: string,
    type: NotificationType,
    message: string,
    idempotencyKey: string,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      await this.create({ userId, type, message, idempotencyKey, metadata });
    } catch (err) {
      this.logger.error(
        `Failed to create notification: ${(err as Error).message}`,
      );
    }
  }

  private getNotificationTitle(type: NotificationType): string {
    switch (type) {
      case NotificationType.GENERAL: return 'System Alert';
      case NotificationType.EVENT_RSVP: return 'Event RSVP';
      case NotificationType.EVENT_STATUS_CHANGED: return 'Event Status Updated';
      case NotificationType.JOB_APPLIED: return 'New Job Application';
      case NotificationType.JOB_STATUS_CHANGED: return 'Job Status Updated';
      case NotificationType.POST_LIKED: return 'Post Liked';
      default: return 'Notification';
    }
  }
}
