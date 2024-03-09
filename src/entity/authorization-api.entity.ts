import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class AuthorizationApi {
  @Prop()
  ip: string;

  @Prop()
  apiSecret: string;
}

export type AuthorizationApiDocument = HydratedDocument<AuthorizationApi>;

export const AuthorizationApiSchema =
  SchemaFactory.createForClass(AuthorizationApi);
