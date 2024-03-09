import { Injectable } from '@nestjs/common';
import { SendMessageDTO } from './dto/send-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { MongooseCollection, MongooseDocument } from './entity/mongoose.entity';
import { Model } from 'mongoose';
import makeWASocket, {
  DisconnectReason,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { useAuthState } from './utils/useAuthState';
import { logger } from './utils/logger';

@Injectable()
export class AppService {
  private env = process.env.NODE_ENV;

  constructor(
    @InjectModel(MongooseCollection.name)
    private readonly model: Model<MongooseDocument>,
  ) {}

  private sock: ReturnType<typeof makeWASocket>;

  private del = async (key: string) => {
    await this.model.deleteMany({ key: new RegExp(key) });
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

    this.sock.ev.on('creds.update', async () => {
      await saveCreds();
    });

    this.sock.ev.on('messages.upsert', async (m) => {
      console.log('replying to', m.messages[0].key.remoteJid);
      if (m.type === 'notify')
        await this.sock.sendMessage(m.messages[0].key.remoteJid, {
          text: 'hello',
        });
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

  async sendMessage(dto: SendMessageDTO) {
    try {
      await this.sock.sendMessage(`${dto.phone}@s.whatsapp.net`, {
        text: dto.message,
      });
    } catch (error) {
      console.error('error sending message', (error as Error).message);
      return;
    }
  }
}
