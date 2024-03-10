import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { SendMessageDTO } from './dto/send-message.dto';
import { AuthorizationGuard } from './authorization/authorization.guard';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/token')
  getToken(@Req() req: Request) {
    return this.appService.getToken(req.ip);
  }

  @Get('/token/:ip')
  getDetailToken(@Param('ip') ip: string) {
    return this.appService.getDetailToken(ip);
  }

  @Post()
  @UseGuards(AuthorizationGuard)
  sendMessage(@Body() dto: SendMessageDTO, @Req() req: Request) {
    return this.appService.sendMessage(dto, req.ip);
  }
}
