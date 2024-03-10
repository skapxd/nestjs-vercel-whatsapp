import { Injectable } from '@nestjs/common';
import { SendMessageDTO } from './dto/send-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import makeWASocket, {
  DisconnectReason,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { useAuthState } from './utils/useAuthState';
import { logger } from './utils/logger';
import {
  WhatsAppAuthStateDocument,
  WhatsAppAuthState,
} from './entity/whats-app-auto-state.entity';
import {
  AuthorizationApi,
  AuthorizationApiDocument,
} from './entity/authorization-api.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class AppService {
  private env = process.env.NODE_ENV;

  constructor(
    @InjectModel(WhatsAppAuthState.name)
    private readonly whatsAppModel: Model<WhatsAppAuthStateDocument>,
    @InjectModel(AuthorizationApi.name)
    private readonly authApiModel: Model<AuthorizationApiDocument>,
  ) {}

  private sock: ReturnType<typeof makeWASocket>;

  private del = async (key: string) => {
    await this.whatsAppModel.deleteMany({ key: new RegExp(key) });
  };

  async connectToWhatsApp(): Promise<ReturnType<typeof makeWASocket>> {
    let resolve: (value: ReturnType<typeof makeWASocket>) => void;

    const promise: Promise<ReturnType<typeof makeWASocket>> = new Promise(
      async (res) => {
        resolve = res;
      },
    );

    const { state, saveCreds } = await useAuthState(`whatsapp_${this.env}`, {
      del: async (key) => {
        await this.whatsAppModel.deleteOne({ key });
      },
      get: async (key) => {
        const resp = await this.whatsAppModel.findOne({ key });
        return resp?.data;
      },
      set: async (key, value) => {
        await this.whatsAppModel.updateOne(
          { key },
          {
            data: value,
          },
          {
            upsert: true,
            returnDocument: 'after',
            new: true,
          },
        );
      },
    });

    this.sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger as any),
      },
      printQRInTerminal: true,
    });

    this.sock.ev.on('creds.update', async () => {
      await saveCreds();
    });

    this.sock.ev.on('messages.upsert', async (m) => {
      console.log('replying to', m.messages[0].key.remoteJid);
      // if (m.type === 'notify')
      //   await this.sock.sendMessage(m.messages[0].key.remoteJid, {
      //     text: 'hello',
      //   });
    });

    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;
      console.log({
        connection,
        statusCode: (lastDisconnect?.error as any)?.output?.statusCode,
      });

      if (connection === 'open') {
        return resolve(this.sock);
      }

      if ((lastDisconnect?.error as any)?.output?.statusCode === 401)
        await this.del(this.env);

      const shouldReconnect =
        (lastDisconnect?.error as any)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (connection === 'close' && shouldReconnect) {
        await this.connectToWhatsApp().catch((e) =>
          console.error('error reconnecting', e.message),
        );
      }
    });

    return promise;
  }

  async sendMessage(dto: SendMessageDTO, ip: string) {
    try {
      await this.sock.sendMessage(`${dto.phone}@s.whatsapp.net`, {
        text: dto.message,
      });

      // TODO: Decrementar el contador de peticiones
      await this.authApiModel.updateOne({ ip }, { $inc: { counter: -1 } });
    } catch (error) {
      console.error('error sending message', (error as Error).message);
      return;
    }
  }

  async getDetailToken(ip: string) {
    throw new Error('Method not implemented.');
  }

  async getToken(ip: string) {
    // TODO: Verificar si ya existe un token para la ip donde el registro tenga menos de 24 horas de creado
    const now = new Date();
    const row = await this.authApiModel.findOne({
      ip,
      createdAt: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      },
    });
    // .where('createdAt')
    // .gt(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).getTime());

    // TODO: Si ya existe un token para la ip, retornar el token
    if (row?.apiSecret)
      return {
        apiSecret: row.apiSecret,
        remainingRequests: row.counter,
      };

    // TODO: Generar solo un token por dia y por ip
    const apiSecret = randomUUID();

    // TODO: Si no existe un token para la ip, crear un token y retornarlo
    await this.authApiModel.create({ ip, apiSecret });

    return {
      apiSecret,
      remainingRequests: 10,
    };
  }
}
