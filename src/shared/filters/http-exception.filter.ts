import {
    ExceptionFilter, Catch, ArgumentsHost,
    HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

const PG_ERROR_MESSAGES: Record<string, { status: number; message: string }> = {
    '22001': {
        status: HttpStatus.BAD_REQUEST,
        message: 'Um ou mais campos de texto excedem o limite permitido. Tente encurtar os campos de texto livre.',
    },
    '23505': {
        status: HttpStatus.CONFLICT,
        message: 'Já existe um registro com esses dados.',
    },
    '23503': {
        status: HttpStatus.BAD_REQUEST,
        message: 'Operação inválida: referência a um registro inexistente.',
    },
    '57014': {
        status: HttpStatus.REQUEST_TIMEOUT,
        message: 'A operação demorou tempo demais. Tente novamente.',
    },
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx      = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request  = ctx.getRequest<Request>();

        if (exception instanceof HttpException) {
            const status  = exception.getStatus();
            const message = (exception.getResponse() as any)?.message ?? exception.message;
            return response.status(status).json({
                statusCode: status,
                message,
                path:      request.url,
                timestamp: new Date().toISOString(),
            });
        }

        const pgCode = (exception as any)?.cause?.code     // drizzle wraps the pg error
            ?? (exception as any)?.code;

        if (pgCode && PG_ERROR_MESSAGES[pgCode]) {
            const { status, message } = PG_ERROR_MESSAGES[pgCode];
            return response.status(status).json({
                statusCode: status,
                message,
                path:      request.url,
                timestamp: new Date().toISOString(),
            });
        }

        this.logger.error(
            `[${request.method}] ${request.url}`,
            exception instanceof Error ? exception.stack : String(exception),
        );

        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message:    'Erro interno no servidor.',
            path:       request.url,
            timestamp:  new Date().toISOString(),
        });
    }
}