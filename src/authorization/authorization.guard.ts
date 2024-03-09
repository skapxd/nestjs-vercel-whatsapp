import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AuthorizationApi,
  AuthorizationApiDocument,
} from 'src/entity/authorization-api.entity';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    @InjectModel(AuthorizationApi.name)
    private readonly model: Model<AuthorizationApiDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = `Bearer ${process.env.API_SECRET}`.toLowerCase();
    const authorization = request.headers.authorization?.toLowerCase();

    if (!authorization) throw new UnauthorizedException();

    const row = await this.model.findOne({ ip: request.ip });

    if (authorization !== token) throw new UnauthorizedException();

    return true;
  }
}
