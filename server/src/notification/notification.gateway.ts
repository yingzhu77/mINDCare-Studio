import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../config/config.service';
import { Logger } from '@nestjs/common';

/**
 * WebSocket 通知网关
 * 命名空间 /ws/notifications，客户端连接时通过 auth.token 携带 JWT 认证
 * 连接成功后加入 user:{userId} 房间，实现定向推送
 */
@WebSocketGateway({
  namespace: '/ws/notifications',
  cors: { origin: '*', credentials: true },
})
export class NotificationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('Notification WebSocket Gateway 初始化完成');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        this.logger.warn('WS 连接拒绝：未提供 token');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token as string, {
        secret: this.configService.jwtSecret,
      });
      const userId = payload.sub;
      client.join(`user:${userId}`);
      client.data.userId = userId;
      this.logger.log(`WS 客户端已连接：user=${userId}, clientId=${client.id}`);
    } catch {
      this.logger.warn('WS 连接拒绝：token 无效或已过期');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.logger.log(`WS 客户端已断开：user=${userId}, clientId=${client.id}`);
    }
  }

  /**
   * 向指定用户推送未读通知计数变更
   */
  notifyUnreadCount(userId: number, count: number) {
    this.server.to(`user:${userId}`).emit('unread_count', { count });
  }
}
