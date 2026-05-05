import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Put, Req, Res, UseGuards} from '@nestjs/common';
import type {Response, Request} from 'express';
import {AuthCookieService} from './auth-cookie.service';
import {AuthService} from './auth.service';
import {UserService} from '../user/user.service';
import {JwtAuthGuard} from './guards/jwt-auth.guard';
import {RegisterDto} from './dto/register.dto';
import {LoginDto} from './dto/login.dto';
import {GoogleAuthDto} from './dto/google-auth.dto';
import {ForgotPasswordDto} from './dto/forgot-password.dto';
import {ResetPasswordDto} from './dto/reset-password.dto';
import {ConfirmEmailDto} from './dto/confirm-email.dto';
import {UpdateUserDto} from '../user/dto/update-user.dto';
import {ChangePasswordDto} from '../user/dto/change-password.dto';
import {UserRecord} from '../../database/schema';

interface AuthRequest extends Request {
    user: UserRecord;
}

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
        private readonly authCookieService: AuthCookieService,
    ) {
    }

    @Post('register')
    async register(@Body() dto: RegisterDto, @Res({passthrough: true}) res: Response) {
        const result = await this.authService.register(dto);
        this.authCookieService.setAuthCookies(res, result.token);
        return {user: result.user};
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto, @Res({passthrough: true}) res: Response) {
        const result = await this.authService.login(dto);
        this.authCookieService.setAuthCookies(res, result.token);
        return {user: result.user};
    }

    @Post('google')
    @HttpCode(HttpStatus.OK)
    async loginWithGoogle(@Body() dto: GoogleAuthDto, @Res({passthrough: true}) res: Response) {
        const result = await this.authService.loginWithGoogle(dto.credential, dto.acceptTerms);
        this.authCookieService.setAuthCookies(res, result.token);
        return {user: result.user};
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    logout(@Res({passthrough: true}) res: Response) {
        this.authCookieService.clearAuthCookies(res);
        return;
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@Req() req: AuthRequest) {
        return this.authService.getMe(req.user);
    }

    @Post('confirm-email')
    @HttpCode(HttpStatus.OK)
    confirmEmail(@Body() dto: ConfirmEmailDto) {
        return this.authService.confirmEmail(dto.token);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.token, dto.newPassword);
    }

    @Put('profile')
    @UseGuards(JwtAuthGuard)
    updateProfile(
        @Req() req: AuthRequest,
        @Body() dto: UpdateUserDto,
    ) {
        return this.userService
            .updateProfile(req.user.id, dto)
            .then(user => this.userService.toPublic(user));
    }

    @Put('change-password')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    changePassword(
        @Req() req: AuthRequest,
        @Body() dto: ChangePasswordDto,
    ) {
        return this.userService.changePassword(req.user.id, dto);
    }

    @Delete('account')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteAccount(@Req() req: AuthRequest) {
        return this.userService.deleteAccount(req.user.id);
    }
}