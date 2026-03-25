import { Inject, Injectable } from '@nestjs/common';
import { eq, or } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.module';
import { users, UserRecord, NewUserRecord } from '../../database/schema';

@Injectable()
export class UserRepository {
    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

    async findById(id: string): Promise<UserRecord | null> {
        const [record] = await this.db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        return record ?? null;
    }

    async findByEmail(email: string): Promise<UserRecord | null> {
        const [record] = await this.db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()))
            .limit(1);
        return record ?? null;
    }

    async findByGoogleId(googleId: string): Promise<UserRecord | null> {
        const [record] = await this.db
            .select()
            .from(users)
            .where(eq(users.googleId, googleId))
            .limit(1);
        return record ?? null;
    }

    async findByEmailConfirmToken(token: string): Promise<UserRecord | null> {
        const [record] = await this.db
            .select()
            .from(users)
            .where(eq(users.emailConfirmToken, token))
            .limit(1);
        return record ?? null;
    }

    async findByPasswordResetToken(token: string): Promise<UserRecord | null> {
        const [record] = await this.db
            .select()
            .from(users)
            .where(eq(users.passwordResetToken, token))
            .limit(1);
        return record ?? null;
    }

    async create(data: NewUserRecord): Promise<UserRecord> {
        const [record] = await this.db
            .insert(users)
            .values(data)
            .returning();
        return record;
    }

    async update(
        id: string,
        data: Partial<NewUserRecord>,
    ): Promise<UserRecord> {
        const [record] = await this.db
            .update(users)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        return record;
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(users)
            .where(eq(users.id, id));
    }
}