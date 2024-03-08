import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = `Bearer ${process.env.API_SECRET}`.toLowerCase();
    const authorization = request.headers.authorization?.toLowerCase();

    if (!authorization) throw new UnauthorizedException();

    if (authorization !== token) throw new UnauthorizedException();

    return true;
  }
}
