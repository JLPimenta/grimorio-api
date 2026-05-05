import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthCookieService } from './auth-cookie.service';
import { UserModule } from '../user/user.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            imports:    [ConfigModule],
            inject:     [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret:      config.getOrThrow<string>('JWT_SECRET'),
                signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') },
            }),
        }),
        UserModule,
        MailModule,
    ],
    controllers: [AuthController],
    providers:   [AuthService, JwtStrategy, AuthCookieService],
    exports:     [AuthService, JwtModule, AuthCookieService],
})
export class AuthModule {}