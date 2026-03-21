import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConversationsService } from './conversations/conversations.service';
import { JwtStrategy } from './auth/strategies/jwt.strategy';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/messaging',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  // Map of userId -> socketId[]
  private userSockets = new Map<string, Set<string>>();

  constructor(private readonly conversationsService: ConversationsService) {}

  handleConnection(client: Socket) {
    // Auth is done via query param token (client sends access_token as query)
    // In production, validate JWT here using jwksUri; for now we trust the userId claim
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      this.logger.warn(`Client ${client.id} connected without userId — disconnecting`);
      client.disconnect();
      return;
    }
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);
    client.data.userId = userId;
    this.logger.log(`Client connected: ${client.id} as user ${userId}`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /** Client joins a conversation room */
  @SubscribeMessage('join-conversation')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    client.join(`conv:${payload.conversationId}`);
    this.logger.log(
      `${client.data.userId} joined room conv:${payload.conversationId}`,
    );
    return { joined: payload.conversationId };
  }

  /** Client sends a message over WebSocket */
  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; content: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const message = await this.conversationsService.sendMessage(
      payload.conversationId,
      userId,
      { content: payload.content },
    );

    // Broadcast to all in the conversation room
    this.server
      .to(`conv:${payload.conversationId}`)
      .emit('message-received', message);

    return message;
  }

  /** Client is typing indicator */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; isTyping: boolean },
  ) {
    client
      .to(`conv:${payload.conversationId}`)
      .emit('user-typing', {
        userId: client.data.userId,
        isTyping: payload.isTyping,
      });
  }

  /** Emit a message to a specific user's connected sockets (called from service) */
  emitToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      for (const socketId of sockets) {
        this.server.to(socketId).emit(event, data);
      }
    }
  }
}
