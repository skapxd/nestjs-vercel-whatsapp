import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class QueueSendMessage {
  createdAt: Date;
  updatedAt: Date;

  @Prop()
  phone: string;

  @Prop()
  message: string;

  @Prop()
  ip: string;
}

export type QueueSendMessageDocument = HydratedDocument<QueueSendMessage>;

export const QueueSendMessageSchema =
  SchemaFactory.createForClass(QueueSendMessage);
