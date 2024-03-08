import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseCollection, MongooseSchema } from './mongoose.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'public') }),
    MongooseModule.forRoot(process.env.MONGO_DB),
    MongooseModule.forFeature([
      { name: MongooseCollection.name, schema: MongooseSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: AppService.name,
      useFactory: async (service: AppService): Promise<any> => {
        await service.connectToWhatsApp();
        return service;
      },
      inject: [AppService],
    },
  ],
})
export class AppModule {}
