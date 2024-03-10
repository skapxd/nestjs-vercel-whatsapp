import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WhatsAppAuthState,
  WhatsAppAuthStateSchema,
} from './entity/whats-app-auto-state.entity';
import {
  AuthorizationApi,
  AuthorizationApiSchema,
} from './entity/authorization-api.entity';
import {
  QueueSendMessage,
  QueueSendMessageSchema,
} from './entity/queue-send-message.entity';

@Module({
  imports: [
    ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'public') }),
    MongooseModule.forRoot(process.env.MONGO_DB),
    MongooseModule.forFeature([
      { name: WhatsAppAuthState.name, schema: WhatsAppAuthStateSchema },
      { name: AuthorizationApi.name, schema: AuthorizationApiSchema },
      { name: QueueSendMessage.name, schema: QueueSendMessageSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: AppService.name,
    //   useFactory: async (service: AppService): Promise<any> => {
    //     await service.connectToWhatsApp();
    //     return service;
    //   },
    //   inject: [AppService],
    // },
  ],
})
export class AppModule {}
