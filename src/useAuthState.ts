import {
  AuthenticationCreds,
  AuthenticationState,
  BufferJSON,
  SignalDataTypeMap,
  initAuthCreds,
  proto,
} from '@whiskeysockets/baileys';

interface AuthState {
  set: (key: string, value: string) => Promise<void>;
  get: (key: string) => Promise<string | null>;
  del: (key: string) => Promise<void>;
}

export const useAuthState = async (
  folder: string,
  { set, get, del }: AuthState,
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {
  const writeData = async (data: any, file: string) => {
    const clone = JSON.stringify(data, BufferJSON.replacer);
    // await model.updateOne(
    //   { folder, file },
    //   {
    //     data: clone,
    //   },
    //   {
    //     upsert: true,
    //     returnDocument: 'after',
    //     new: true,
    //   },
    // );

    await set(`${folder}-${file}`, clone);
  };

  const readData = async (file: string) => {
    try {
      const resp = await get(`${folder}-${file}`);

      return JSON.parse(resp, BufferJSON.reviver);
    } catch (error) {
      return null;
    }
  };

  const removeData = async (file: string) => {
    try {
      // await model.deleteOne({
      //   folder,
      //   file,
      // });

      await del(`${folder}-${file}`);
    } catch {}
  };

  const data = await readData('creds.json');

  const creds: AuthenticationCreds = data || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [_: string]: SignalDataTypeMap[typeof type] } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}.json`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }

              data[id] = value;
            }),
          );

          return data;
        },
        set: async (data) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const file = `${category}-${id}.json`;
              tasks.push(value ? writeData(value, file) : removeData(file));
            }
          }

          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => {
      return writeData(creds, 'creds.json');
    },
  };
};
