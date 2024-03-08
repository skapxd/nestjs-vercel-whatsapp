import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { SendMessageDTO } from './dto/send-message.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  sendMessage(@Body() dto: SendMessageDTO) {
    return this.appService.sendMessage(dto);
  }
}
