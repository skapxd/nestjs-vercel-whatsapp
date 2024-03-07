import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
@Injectable()
export class AppService {
  async getHello() {
    const file = await readFile('package.json', 'utf-8');
    return file;
  }
}
