import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.config.js';
import { logger } from '../../common/logging/logger.js';

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  role?: string;
  isAlive?: boolean;
}

export class RealtimeService {
  private static instance: RealtimeService;
  private wss: WebSocketServer | null = null;
  private userClients: Map<string, Set<AuthenticatedSocket>> = new Map();
  private adminClients: Set<AuthenticatedSocket> = new Set();
  private merchantClients: Map<string, Set<AuthenticatedSocket>> = new Map();

  private constructor() {}

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  public initialize(server: HttpServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: AuthenticatedSocket, req) => {
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Parse token from query (?token=...) or Sec-WebSocket-Protocol
      try {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const token =
          url.searchParams.get('token') ||
          (req.headers['authorization'] || '').replace('Bearer ', '');

        if (token) {
          const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
            userId: string;
            role: string;
          };
          ws.userId = decoded.userId;
          ws.role = decoded.role;

          // Register in user room
          if (!this.userClients.has(decoded.userId)) {
            this.userClients.set(decoded.userId, new Set());
          }
          this.userClients.get(decoded.userId)!.add(ws);

          if (decoded.role === 'ADMIN') {
            this.adminClients.add(ws);
          } else if (decoded.role === 'MERCHANT') {
            if (!this.merchantClients.has(decoded.userId)) {
              this.merchantClients.set(decoded.userId, new Set());
            }
            this.merchantClients.get(decoded.userId)!.add(ws);
          }

          logger.debug({ userId: decoded.userId, role: decoded.role }, 'WebSocket authenticated');
        }
      } catch (err) {
        logger.debug('WebSocket connected anonymously or token invalid');
      }

      ws.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          }
        } catch {}
      });

      ws.on('close', () => {
        if (ws.userId) {
          const set = this.userClients.get(ws.userId);
          if (set) {
            set.delete(ws);
            if (set.size === 0) this.userClients.delete(ws.userId);
          }
        }
        this.adminClients.delete(ws);
        if (ws.userId) {
          const mSet = this.merchantClients.get(ws.userId);
          if (mSet) {
            mSet.delete(ws);
            if (mSet.size === 0) this.merchantClients.delete(ws.userId);
          }
        }
      });
    });

    // Heartbeat ping/pong interval
    const interval = setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((client) => {
        const authWs = client as AuthenticatedSocket;
        if (authWs.isAlive === false) return authWs.terminate();
        authWs.isAlive = false;
        authWs.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });

    logger.info('📡 Real-time WebSocket server initialized on path /ws');
  }

  public emitToUser(userId: string, event: string, payload: any): void {
    const clients = this.userClients.get(userId.toString());
    if (!clients || clients.size === 0) return;

    const message = JSON.stringify({ event, data: payload, timestamp: Date.now() });
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  public emitToAdmins(event: string, payload: any): void {
    if (this.adminClients.size === 0) return;
    const message = JSON.stringify({ event, data: payload, timestamp: Date.now() });
    this.adminClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  public emitWalletUpdated(userId: string, balancePaise: number, transaction: any): void {
    this.emitToUser(userId, 'wallet:updated', {
      type: 'WALLET_BALANCE_UPDATED',
      balancePaise,
      balanceRupees: balancePaise / 100,
      transaction,
    });

    this.emitToAdmins('admin:wallet:activity', {
      userId,
      balancePaise,
      transaction,
    });
  }

  public emitCartUpdated(userId: string, cart: any): void {
    this.emitToUser(userId, 'cart:updated', {
      type: 'CART_UPDATED',
      cart,
    });
  }

  public emitNotificationsRead(userId: string, readNotificationIds: string[]): void {
    this.emitToUser(userId, 'notifications:read', {
      type: 'NOTIFICATIONS_READ',
      readNotificationIds,
    });
  }

  public emitNewNotification(userId: string, notification: any): void {
    this.emitToUser(userId, 'notification:new', {
      type: 'NEW_NOTIFICATION',
      notification,
    });
  }
}

export const realtimeService = RealtimeService.getInstance();
