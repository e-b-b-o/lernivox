import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';

export interface ValidatedGoogleUser {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);
  readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID', '');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET', '');
    const callbackURL = configService.get<string>(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:4000/api/v1/auth/google/callback',
    );

    const configured =
      Boolean(clientID) &&
      Boolean(clientSecret) &&
      !clientID.includes('placeholder') &&
      !clientSecret.includes('placeholder');

    super({
      clientID: configured ? clientID : 'mock-google-client-id',
      clientSecret: configured ? clientSecret : 'mock-google-client-secret',
      callbackURL,
      scope: ['email', 'profile'],
    });

    this.isConfigured = configured;
    if (!configured) {
      this.logger.warn(
        'Google OAuth credentials not configured in environment. Google sign-in will operate in mock-test mode.',
      );
    }
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const primaryEmail = profile.emails?.[0];
    const email = primaryEmail?.value ?? '';
    const emailVerified = primaryEmail?.verified === true;
    const name = profile.displayName || [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ') || null;
    const picture = profile.photos?.[0]?.value;

    const validatedUser: ValidatedGoogleUser = {
      googleId: profile.id,
      email: email.toLowerCase().trim(),
      emailVerified,
      name,
      picture,
    };

    done(null, validatedUser);
  }
}
