import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import swaggerUi from 'swagger-ui';

@Injectable()
export class AppService {
  async getHello() {
    const file = await readFile('index.html', 'utf-8');

    return file;
  }

  async getSwagger() {
    const file = await readFile('swagger.json', 'utf-8');
    return JSON.parse(file);
  }
}
