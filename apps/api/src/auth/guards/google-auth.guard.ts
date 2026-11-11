import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { GoogleStrategy } from '../strategies/google.strategy';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(
    private readonly googleStrategy: GoogleStrategy,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    if (!this.googleStrategy.isConfigured) {
      const http = context.switchToHttp();
      const res = http.getResponse<Response>();
      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      );
      // Gracefully redirect to frontend login without throwing a noisy 503 error
      if (res && typeof res.redirect === 'function') {
        res.redirect(HttpStatus.FOUND, `${frontendUrl}/login`);
        return false;
      }
      return false;
    }
    return super.canActivate(context);
  }
}
