import { IsString, MaxLength } from '@nestjs/class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDTO {
  @ApiProperty({ default: '573216661006' })
  @IsString()
  @MaxLength(255)
  phone: string;

  @ApiProperty({ default: 'Hello world' })
  @IsString()
  @MaxLength(255)
  message: string;
}
