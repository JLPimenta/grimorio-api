import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx      = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request  = ctx.getRequest<Request>();

        const isHttp   = exception instanceof HttpException;
        const status   = isHttp
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const message  = isHttp
            ? (exception.getResponse() as any)?.message ?? exception.message
            : 'Erro interno no servidor';

        // Loga o erro completo no servidor — não expõe ao cliente
        if (!isHttp) {
            this.logger.error(
                `[${request.method}] ${request.url}`,
                exception instanceof Error ? exception.stack : String(exception),
            );
        }

        response.status(status).json({
            statusCode: status,
            message,
            path:      request.url,
            timestamp: new Date().toISOString(),
        });
    }
}