import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import {Pool} from "pg";
import {neon} from "@neondatabase/serverless";

export const DRIZZLE = Symbol('DRIZZLE');
export type DrizzleDB = ReturnType<typeof drizzleNode<typeof schema>>;

@Global()
@Module({
    providers: [
        {
            provide: DRIZZLE,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const url = config.getOrThrow<string>('DATABASE_URL')
                const isLocal = config.get<string>('NODE_ENV') !== 'production'


                if (isLocal) {
                    const pool = new Pool({ connectionString: url })
                    return drizzleNode(pool, { schema })
                }

                const sql = neon(url)
                return drizzleNeon(sql, { schema })
            },
        },
    ],
    exports: [DRIZZLE],
})
export class DatabaseModule {}