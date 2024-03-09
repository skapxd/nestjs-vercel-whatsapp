import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { INestApplication } from '@nestjs/common';
import { mainConfig } from './utils/mainConfig';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppService } from './app.service';
import {
  WhatsAppAuthState,
  WhatsAppAuthStateSchema,
} from './entity/whats-app-auto-state.entity';

describe('AppController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.MONGO_DB),
        MongooseModule.forFeature([
          { name: WhatsAppAuthState.name, schema: WhatsAppAuthStateSchema },
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
    }).compile();

    app = module.createNestApplication();

    mainConfig(app);

    await app.init();
  }, 1_000_000);

  it('should to be defined', () => {
    expect(app).toBeDefined();
  });

  it('should send message to 573216661006', async () => {
    const resp = await request(app.getHttpServer())
      .post('/')
      .send({
        phone: '573216661006',
        message: 'Hello world',
      })
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + process.env.API_SECRET);

    expect(resp.status).toBe(201);
  }, 1_000_000);
});
