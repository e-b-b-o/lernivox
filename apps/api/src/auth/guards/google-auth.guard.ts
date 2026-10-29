import { ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoogleStrategy } from '../strategies/google.strategy';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly googleStrategy: GoogleStrategy) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    if (!this.googleStrategy.isConfigured) {
      throw new ServiceUnavailableException(
        'Google OAuth 2.0 is not configured in this environment. Please provide GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      );
    }
    return super.canActivate(context);
  }
}
