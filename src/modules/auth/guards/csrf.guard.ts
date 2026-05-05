import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from '@nestjs/common';
import type {Request} from 'express';
import {AUTH_COOKIE_NAME, CSRF_COOKIE_NAME} from '../../../shared/constants/auth.constants';

/**
 * Guard global de proteção contra Cross-Site Request Forgery (CSRF).
 *
 * Implementa o padrão "Double Submit Cookie":
 * 1. O backend emite um cookie legível (não-HttpOnly) com um token aleatório.
 * 2. O frontend lê esse cookie e o reenvia como header em requisições de mutação.
 * 3. Este guard compara cookie vs header — se divergirem, a requisição é rejeitada.
 *
 * A validação é intencionalmente ignorada quando não existe cookie de sessão
 * (AUTH_COOKIE_NAME), pois ataques CSRF exploram sessões autenticadas ativas.
 * Sem sessão, não há privilégio a ser explorado.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
    private static readonly SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<Request>();

        if (CsrfGuard.SAFE_METHODS.has(req.method)) {
            return true;
        }

        // Sem sessão autenticada → sem risco de CSRF → liberar
        const hasSession = !!req.cookies?.[AUTH_COOKIE_NAME];
        if (!hasSession) {
            return true;
        }

        const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
        const csrfHeader = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];

        if (!csrfCookie || !csrfHeader) {
            throw new ForbiddenException('Sessão inválida: Token CSRF ausente.');
        }

        if (csrfCookie !== csrfHeader) {
            throw new ForbiddenException('Violação de segurança: O token CSRF não confere.');
        }

        return true;
    }
}
