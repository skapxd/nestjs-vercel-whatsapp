import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { SendMessageDTO } from './dto/send-message.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('test')
  getHello(): string {
    return this.appService.getHello();
  }

  @Post()
  sendMessage(@Body() body: SendMessageDTO) {
    return body;
  }
}
