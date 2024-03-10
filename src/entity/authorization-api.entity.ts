import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class AuthorizationApi {
  createdAt: Date;
  updatedAt: Date;

  @Prop()
  ip: string;

  @Prop()
  apiSecret: string;

  @Prop({ default: 10 })
  counter: number;
}

export type AuthorizationApiDocument = HydratedDocument<AuthorizationApi>;

export const AuthorizationApiSchema =
  SchemaFactory.createForClass(AuthorizationApi);
