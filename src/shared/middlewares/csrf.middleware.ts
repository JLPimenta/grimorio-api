import {Injectable, NestMiddleware, ForbiddenException} from '@nestjs/common';
import type {Request, Response, NextFunction} from 'express';
import {AUTH_COOKIE_NAME, CSRF_COOKIE_NAME, CSRF_HEADER_NAME, FALLBACK_CSRF_HEADER_NAME} from '../constants/auth.constants';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Métodos seguros (leitura) não precisam de proteção CSRF
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            return next();
        }

        // Se não há sessão ativa, não há o que proteger contra CSRF
        if (!req.cookies[AUTH_COOKIE_NAME]) {
            return next();
        }

        // A partir daqui, o usuário TEM sessão — CSRF é obrigatório
        const tokenFromCookie = req.cookies[CSRF_COOKIE_NAME];
        const tokenFromHeader = req.headers[CSRF_HEADER_NAME] || req.headers[FALLBACK_CSRF_HEADER_NAME];

        if (!tokenFromCookie || !tokenFromHeader) {
            throw new ForbiddenException('Sessão inválida: Token CSRF ausente.');
        }

        if (tokenFromCookie !== tokenFromHeader) {
            throw new ForbiddenException('Sessão inválida: Token CSRF não confere.');
        }

        next();
    }
}
