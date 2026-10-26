import {Inject, Injectable} from '@nestjs/common';
import {asc, eq} from 'drizzle-orm';
import {DRIZZLE, type DrizzleDB} from '../../database/database.module';
import {BasicCharacterRecord, CharacterRecord, characters, NewCharacterRecord,} from '../../database/schema';

@Injectable()
export class CharacterRepository {
    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {
    }

    /** Listagem do dashboard: só o envelope, nunca o blob `data`. */
    findAll(userId: string): Promise<BasicCharacterRecord[]> {
        return this.db
            .select({
                id: characters.id,
                system: characters.system,
                name: characters.name,
                level: characters.level,
                card: characters.card,
                createdAt: characters.createdAt,
                updatedAt: characters.updatedAt,
                userId: characters.userId,
                isShared: characters.isShared,
            })
            .from(characters)
            .where(eq(characters.userId, userId))
            .orderBy(asc(characters.updatedAt));
    }

    async findById(id: string): Promise<CharacterRecord | null> {
        const [record] = await this.db
            .select()
            .from(characters)
            .where(eq(characters.id, id))
            .limit(1);
        return record ?? null;
    }

    async insert(data: NewCharacterRecord): Promise<CharacterRecord> {
        const [record] = await this.db
            .insert(characters)
            .values(data)
            .returning();
        return record;
    }

    async update(id: string, patch: Omit<Partial<NewCharacterRecord>, 'id' | 'system' | 'userId' | 'createdAt'>): Promise<CharacterRecord> {
        const [record] = await this.db
            .update(characters)
            .set({...patch, updatedAt: new Date()})
            .where(eq(characters.id, id))
            .returning();
        return record;
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(characters)
            .where(eq(characters.id, id));
    }

    async deleteAllByUser(userId: string): Promise<void> {
        await this.db
            .delete(characters)
            .where(eq(characters.userId, userId));
    }
}
