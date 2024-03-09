import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class WhatsAppAuthState {
  @Prop()
  key: string;

  @Prop()
  data: string;
}

export type WhatsAppAuthStateDocument = HydratedDocument<WhatsAppAuthState>;

export const WhatsAppAuthStateSchema =
  SchemaFactory.createForClass(WhatsAppAuthState);
