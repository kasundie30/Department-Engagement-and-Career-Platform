import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
  Request,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateNotificationDto } from './dto/notification.dto';
import { TokenType } from './schemas/device-token.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
  ) { }



  /** Emit an internal event (used for testing event listener wiring). */
  @Post('emit/:event')
  async emitEvent(
    @Param('event') event: string,
    @Body() payload: Record<string, unknown>,
  ) {
    this.eventEmitter.emit(`notification.${event}`, payload);
    return { emitted: `notification.${event}` };
  }

  /** GET inbox — optionally filter to unread only via ?unread=true */
  @Get()
  async getMyNotifications(@Request() req, @Query('unread') unread?: string) {
    return this.notificationsService.findForUser(
      req.user.sub,
      unread === 'true',
    );
  }

  /** GET unread notification count */
  @Get('count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.countUnread(req.user.sub);
    return { count };
  }

  /** Mark a single notification as read */
  @Post(':id/read')
  async markRead(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    return this.notificationsService.markRead(id, userId);
  }

  @Post('tokens')
  async registerToken(
    @Req() req: any,
    @Body('token') token: string,
    @Body('type') type: TokenType,
  ) {
    if (!token || !type) {
      throw new BadRequestException('Token and type are required');
    }
    const userId = req.user.sub;
    await this.notificationsService.registerToken(userId, token, type);
    return { success: true };
  }

  /** Mark all notifications as read */
  @Patch('read-all')
  async markAllRead(@Request() req) {
    return this.notificationsService.markAllRead(req.user.sub);
  }
}
