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

  private del = async (key: string) => {
    await this.model.deleteMany({ key: new RegExp(key) });
  };

  async connectToWhatsApp(): Promise<ReturnType<typeof makeWASocket>> {
    let resolve: (value: ReturnType<typeof makeWASocket>) => void;
    let reject: (reason?: any) => void;

    const promise: Promise<ReturnType<typeof makeWASocket>> = new Promise(
      async (res, rej) => {
        resolve = res;
        reject = rej;
      },
    );

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
      console.log('connection update', update);
      const { connection, lastDisconnect } = update;

      if (connection === 'open') {
        console.log('opened connection');
        return resolve(this.sock);
      }

      if ((lastDisconnect?.error as any)?.output?.statusCode === 515)
        await this.connectToWhatsApp();

      if ((lastDisconnect?.error as any)?.output?.statusCode === 401) {
        await this.del(process.env.NODE_ENV);
        return await this.connectToWhatsApp();
      }

      const shouldReconnect =
        (lastDisconnect?.error as any)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log(
        'connection closed due to ',
        lastDisconnect?.error,
        ', reconnecting ',
        shouldReconnect,
      );
      console.log({ output: (lastDisconnect?.error as any)?.output });

      if (connection === 'close' && shouldReconnect) {
        // reconnect if not logged out
        await this.connectToWhatsApp().catch((e) => {
          reject(e);
          console.error('error reconnecting', e.message);
          process.exit(1);
        });
      }
    });

    return promise;
  }

  async sendMessage(dto: SendMessageDTO) {
    try {
      this.sock
        .sendMessage(`${dto.phone}@s.whatsapp.net`, {
          text: dto.message,
        })
        .catch((e) => console.error('error sending message', e.message));
    } catch (error) {
      console.error('error sending message', (error as Error).message);
      return;
    }
  }
}
