import { Logger as DrizzleLogger } from 'drizzle-orm';
import { Logger as NestLogger } from '@nestjs/common';

export class SafeDrizzleLogger implements DrizzleLogger {
    private readonly logger = new NestLogger('Drizzle');
    private readonly isProd: boolean;

    constructor(isProd: boolean) {
        this.isProd = isProd;
    }

    logQuery(query: string, params: unknown[]): void {
        if (this.isProd) {
            this.logger.debug(`Query: ${this.redact(query)}`);
        } else {
            this.logger.debug(`Query: ${query} | Params: ${JSON.stringify(params)}`);
        }
    }

    private redact(query: string): string {
        return query.replace(/'[^']{50,}'/g, "'[REDACTED]'");
    }
}