import {Inject, Injectable} from '@nestjs/common';
import {eq} from 'drizzle-orm';
import {DRIZZLE, type DrizzleDB} from '../../database/database.module';
import {BasicCharacterRecord, CharacterRecord, characters, NewCharacterRecord,} from '../../database/schema';

@Injectable()
export class CharacterRepository {
    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {
    }

    findAll(userId: string): Promise<BasicCharacterRecord[]> {
        return this.db
            .select({
                id: characters.id,
                name: characters.name,
                class: characters.class,
                subclass: characters.subclass,
                species: characters.species,
                level: characters.level,
                hitPoints: characters.hitPoints,
                createdAt: characters.createdAt,
                updatedAt: characters.updatedAt,
                userId: characters.userId,
            })
            .from(characters)
            .where(eq(characters.userId, userId))
            .orderBy(characters.updatedAt)
    }

    async findById(id: string): Promise<CharacterRecord | null> {
        const [record] = await this.db
            .select()
            .from(characters)
            .where(eq(characters.id, id))
            .limit(1);
        return record ?? null;
    }

    async save(data: NewCharacterRecord): Promise<CharacterRecord> {
        const [record] = await this.db
            .insert(characters)
            .values(data)
            .onConflictDoUpdate({
                target: characters.id,
                set: {
                    ...data,
                    updatedAt: new Date(),
                },
            })
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