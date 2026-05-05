import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import type {Response} from 'express';
import * as crypto from 'crypto';
import {AUTH_COOKIE_NAME, CSRF_COOKIE_NAME} from '../../shared/constants/auth.constants';

@Injectable()
export class AuthCookieService {
    private readonly isProd: boolean;
    private readonly domain: string | undefined;

    constructor(private readonly config: ConfigService) {
        this.isProd = config.get<string>('NODE_ENV') === 'production';
        this.domain = config.get<string>('COOKIE_DOMAIN') || undefined;
    }

    setAuthCookies(res: Response, token: string) {
        res.cookie(AUTH_COOKIE_NAME, token, {
            domain: this.domain,
            httpOnly: true,
            secure: this.isProd,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        });

        res.cookie(CSRF_COOKIE_NAME, crypto.randomBytes(16).toString('hex'), {
            domain: this.domain,
            httpOnly: false,
            secure: this.isProd,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }

    clearAuthCookies(res: Response) {
        res.clearCookie(AUTH_COOKIE_NAME, {domain: this.domain});
        res.clearCookie(CSRF_COOKIE_NAME, {domain: this.domain});
    }
}
