import { Injectable } from '@nestjs/common';
import { SendMessageDTO } from './dto/send-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { MongooseCollection, MongooseDocument } from './mongoose.entity';
import { Model } from 'mongoose';
import makeWASocket, {
  DisconnectReason,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { useAuthState } from './useAuthState';
import { logger } from './logger';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(MongooseCollection.name)
    private readonly model: Model<MongooseDocument>,
  ) {}

  private sock: ReturnType<typeof makeWASocket>;
  async connectToWhatsApp(): Promise<ReturnType<typeof makeWASocket>> {
    return new Promise(async (resolve, reject) => {
      const env = process.env.NODE_ENV;

      const { state, saveCreds } = await useAuthState(`whatsapp_${env}`, {
        del: async (key) => {
          await this.model.deleteOne({ key });
        },
        get: async (key) => {
          const resp = await this.model.findOne({ key });
          return resp?.data;
        },
        set: async (key, value) => {
          await this.model.updateOne(
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

      this.sock.ev.on('connection.update', async (update) => {
        console.log('connection update', update);
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
          const shouldReconnect =
            (lastDisconnect.error as any)?.output?.statusCode !==
            DisconnectReason.loggedOut;
          console.log(
            'connection closed due to ',
            lastDisconnect.error,
            ', reconnecting ',
            shouldReconnect,
          );
          // reconnect if not logged out
          if (shouldReconnect) {
            this.connectToWhatsApp().catch((e) => {
              reject(e);
              console.error('error reconnecting', e.message);
            });
          }
        } else if (connection === 'open') {
          console.log('opened connection');
          resolve(this.sock);
        }
      });

      this.sock.ev.on('creds.update', async () => {
        await saveCreds();
      });

      this.sock.ev.on('messages.upsert', async (m) => {
        console.log(JSON.stringify(m, undefined, 2));

        console.log('replying to', m.messages[0].key.remoteJid);
      });
    });
  }

  async sendMessages(dto: SendMessageDTO) {
    return dto;
  }
}
