import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateDMDto, CreateGroupDto, SendMessageDto } from './dto/messaging.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  /** Create or retrieve a DM conversation */
  @Post('dm')
  createDM(@Request() req, @Body() dto: CreateDMDto) {
    return this.conversationsService.createOrGetDM(req.user.sub, dto.targetUserId);
  }

  /** Create a group chat */
  @Post('group')
  createGroup(@Request() req, @Body() dto: CreateGroupDto) {
    return this.conversationsService.createGroup(req.user.sub, dto);
  }

  /** List all conversations for the current user */
  @Get()
  listConversations(@Request() req) {
    return this.conversationsService.findByUser(req.user.sub);
  }

  /** Get a single conversation (must be a participant) */
  @Get(':id')
  getConversation(@Param('id') id: string, @Request() req) {
    return this.conversationsService.findById(id, req.user.sub);
  }

  /** Get paginated messages in a conversation */
  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversationsService.getMessages(
      id,
      req.user.sub,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  /** Send a message (REST fallback — WebSocket is preferred) */
  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: SendMessageDto,
  ) {
    return this.conversationsService.sendMessage(id, req.user.sub, dto);
  }

  /** Mark all messages in a conversation as read */
  @Patch(':id/read')
  markRead(@Param('id') id: string, @Request() req) {
    return this.conversationsService.markRead(id, req.user.sub);
  }
}
