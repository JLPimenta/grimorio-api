import {Injectable, UnauthorizedException,} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {ConfigService} from '@nestjs/config';
import {OAuth2Client} from 'google-auth-library';
import * as crypto from 'crypto';
import {UserService} from '../user/user.service';
import {UserRecord} from '../../database/schema';
import {RegisterDto} from './dto/register.dto';
import {LoginDto} from './dto/login.dto';
import {MailService} from '../mail/mail.service';

@Injectable()
export class AuthService {
    private readonly googleClient: OAuth2Client;

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
        private readonly config: ConfigService
    ) {
        this.googleClient = new OAuth2Client(
            config.get<string>('GOOGLE_CLIENT_ID'),
        );
    }

    private generateToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    private signJwt(user: UserRecord): string {
        return this.jwtService.sign({
            sub: user.id,
            email: user.email,
        });
    }

    private buildResponse(user: UserRecord) {
        return {
            user: this.userService.toPublic(user),
            token: this.signJwt(user),
        };
    }

    async register(dto: RegisterDto) {
        await this.validateCaptcha(dto.captchaToken);

        const confirmToken = this.generateToken();

        const user = await this.userService.createWithPassword(
            dto.name,
            dto.email,
            dto.password,
            confirmToken,
        );

        this.mailService
            .sendEmailConfirmation(user.email, user.name, confirmToken)
            .catch(() => null);

        return this.buildResponse(user);
    }

    async login(dto: LoginDto) {
        await this.validateCaptcha(dto.captchaToken);

        const user = await this.userService.findByEmail(dto.email);

        if (!user) {
            throw new UnauthorizedException('Email ou senha incorretos');
        }

        const valid = await this.userService.validatePassword(user, dto.password);
        if (!valid) {
            throw new UnauthorizedException('Email ou senha incorretos');
        }

        return this.buildResponse(user);
    }

    async loginWithGoogle(credential: string, acceptTerms: boolean, nonce?: string) {
        const ticket = await this.googleClient
            .verifyIdToken({
                idToken: credential,
                audience: this.config.get<string>('GOOGLE_CLIENT_ID'),
            })
            .catch(() => {
                throw new UnauthorizedException('Token Google inválido');
            });

        const payload = ticket.getPayload();
        if (!payload?.email) {
            throw new UnauthorizedException('Token Google inválido');
        }

        const {sub: googleId, email, name, picture} = payload;

        if (!nonce) throw new UnauthorizedException('Nonce é obrigatório.');
        
        if (nonce && payload.nonce && payload.nonce !== nonce) {
            throw new UnauthorizedException('Token Google inválido (nonce mismatch)');
        }

        // 1. Já tem conta Google vinculada?
        let user = await this.userService.findByGoogleId(googleId);
        if (user) return this.buildResponse(user);

        // 2. Já tem conta com esse email? Vincula o Google
        user = await this.userService.findByEmail(email);
        if (user) {
            user = await this.userService.linkGoogleAccount(
                user.id,
                googleId,
                picture,
            );
            return this.buildResponse(user);
        }

        // 3. Cria conta nova via Google
        if (!acceptTerms) {
            throw new UnauthorizedException('Você deve aceitar os termos de uso para continuar.');
        }

        user = await this.userService.createWithGoogle(name ?? email, email, googleId, picture);

        return this.buildResponse(user);
    }

    async forgotPassword(email: string): Promise<void> {
        const token = this.generateToken();
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        const user = await this.userService.setPasswordResetToken(
            email,
            token,
            expiry,
        );

        if (!user) return;

        this.mailService
            .sendPasswordReset(user.email, user.name, token)
            .catch(() => null);
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        await this.userService.resetPassword(token, newPassword);
    }

    async confirmEmail(token: string): Promise<void> {
        await this.userService.confirmEmail(token);
    }

    async resendConfirmationEmail(email: string): Promise<void> {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            // Silently return to prevent email enumeration
            return;
        }

        if (user.emailVerified) {
            // Se já foi verificado, não faz sentido reenviar. Silently return.
            return;
        }

        const confirmToken = this.generateToken();
        await this.userService.updateEmailConfirmToken(user.id, confirmToken);

        this.mailService
            .sendEmailConfirmation(user.email, user.name, confirmToken)
            .catch(() => null);
    }

    getMe(user: UserRecord) {
        return this.userService.toPublic(user);
    }

    async validateCaptcha(captchaToken: string) {
        const secret = this.config.get<string>('RECAPTCHA_SECRET_KEY');

        const response = await fetch(
            `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${captchaToken}`,
            {method: 'POST'}
        );
        const {success} = await response.json();
        if (!success) throw new UnauthorizedException('Captcha inválido.');
    }
}