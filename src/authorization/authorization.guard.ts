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

    const authorization = request.headers.authorization?.toLowerCase();
    if (!authorization) throw new UnauthorizedException();

    // TODO: Implementar tokenRoot: generado desde una variable de entorno
    const tokenRoot = `Bearer ${process.env.API_SECRET}`.toLowerCase();
    if (authorization === tokenRoot) return true;

    const now = new Date();
    const row = await this.model.findOne({
      ip: request.ip,
      createdAt: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      },
    });

    if (!row) throw new UnauthorizedException();

    // TODO: Implementar limites de uso
    if (row.counter <= 0)
      throw new UnauthorizedException({
        error: 'Exceeded the limits of use',
      });

    // TODO: Implementar tokenUser: generado desde un valor en base de datos
    const tokenUser = `Bearer ${row.apiSecret}`.toLowerCase();

    if (authorization === tokenUser) return true;

    throw new UnauthorizedException();
  }
}
