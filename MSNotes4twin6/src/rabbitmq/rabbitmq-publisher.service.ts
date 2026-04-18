import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

export const SCHOOL_EVENTS_EXCHANGE = 'school.events';

const RECONNECT_MS = 15_000;

@Injectable()
export class RabbitMqPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqPublisherService.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private rabbitEnabled = false;
  private uri: string | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.rabbitEnabled = this.config.get<string>('RABBITMQ_ENABLED', 'true') !== 'false';
    if (!this.rabbitEnabled) {
      this.logger.warn('RabbitMQ désactivé (RABBITMQ_ENABLED=false).');
      return;
    }
    this.uri = this.config.get<string>('RABBITMQ_URI', 'amqp://guest:guest@127.0.0.1:5672');
    await this.tryConnect();
  }

  private async tryConnect(): Promise<void> {
    if (!this.uri) {
      return;
    }
    await this.closeQuietly();
    try {
      const conn = await amqp.connect(this.uri);
      this.connection = conn;
      const ch = await conn.createChannel();
      this.channel = ch;
      await ch.assertExchange(SCHOOL_EVENTS_EXCHANGE, 'topic', { durable: true });
      this.logger.log(
        `RabbitMQ connecté — exchange "${SCHOOL_EVENTS_EXCHANGE}" (127.0.0.1:5672 ou RABBITMQ_URI). Les logs "[RabbitMQ] Message envoyé" apparaîtront à chaque publication.`,
      );
      if (this.reconnectTimer != null) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    } catch (err) {
      this.logger.warn(
        `RabbitMQ indisponible — aucun message ne part tant que le broker n'est pas joignable (${(err as Error).message}). Nouvel essai dans ${RECONNECT_MS / 1000} s.`,
      );
      this.connection = null;
      this.channel = null;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer != null || !this.rabbitEnabled) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.tryConnect();
    }, RECONNECT_MS);
  }

  private async closeQuietly(): Promise<void> {
    try {
      await this.channel?.close();
    } catch {
      /* ignore */
    }
    try {
      await this.connection?.close();
    } catch {
      /* ignore */
    }
    this.channel = null;
    this.connection = null;
  }

  async onModuleDestroy() {
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    await this.closeQuietly();
  }

  /** Publie un événement métier (ne fait pas échouer l’API si RabbitMQ est down). @returns true si le message a été envoyé au broker */
  publish(routingKey: string, payload: Record<string, unknown>): boolean {
    if (!this.channel) {
      this.logger.warn(
        `[RabbitMQ] Publication annulée (broker non connecté) — clé "${routingKey}". Démarrez RabbitMQ ou vérifiez RABBITMQ_URI.`,
      );
      return false;
    }
    const body = Buffer.from(
      JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    );
    try {
      this.channel.publish(SCHOOL_EVENTS_EXCHANGE, routingKey, body, {
        persistent: true,
        contentType: 'application/json',
      });
      this.logger.log(`[RabbitMQ] Message envoyé au broker — clé "${routingKey}".`);
      return true;
    } catch (err) {
      this.logger.warn(`Publication RabbitMQ ignorée: ${(err as Error).message}`);
      return false;
    }
  }
}
