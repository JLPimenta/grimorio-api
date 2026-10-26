import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {CharacterRepository} from './character.repository';
import {CreateCharacterDto} from './dto/create-character.dto';
import {envelopeUpdateSchema} from './dto/update-character.dto';
import {CharacterRecord} from '../../database/schema';
import {resolveBackendSystem} from './systems/registry';
import {BackendSystemDefinition, DEFAULT_SYSTEM_ID, SheetData} from './systems/system.types';
import {
    assertPlainObject,
    CharacterListItem,
    extractData,
    toListItem,
    toWire,
    WireSheet,
    zodToBadRequest,
} from './character.mapper';
import {legacyColumnsFor} from './character.legacy-mirror';

@Injectable()
export class CharacterService {
    constructor(private readonly repo: CharacterRepository) {
    }

    async findAll(userId: string): Promise<CharacterListItem[]> {
        const records = await this.repo.findAll(userId);
        return records.map(toListItem);
    }

    async findOneForUser(id: string, userId: string): Promise<WireSheet> {
        const record = await this.assertOwnership(id, userId);
        return this.present(record);
    }

    async findShared(id: string): Promise<WireSheet> {
        const character = await this.repo.findById(id);

        // Mensagem genérica intencional: não revela se o UUID existe mas está bloqueado
        if (!character || !character.isShared) {
            throw new NotFoundException('Ficha não encontrada ou não está compartilhada.');
        }

        return this.present(character);
    }

    async create(dto: CreateCharacterDto, userId: string): Promise<WireSheet> {
        const system = resolveBackendSystem(dto.system ?? DEFAULT_SYSTEM_ID);
        const data = system.buildDefaultData();
        const level = 1;

        const record = await this.repo.insert({
            system: system.id,
            schemaVersion: system.schemaVersion,
            name: dto.name,
            level,
            data,
            card: system.buildCard(data, level),
            userId,
            ...legacyColumnsFor(system.id, data),
        });
        return toWire(record);
    }

    async update(id: string, body: unknown, userId: string): Promise<WireSheet> {
        assertPlainObject(body);
        const existing = await this.assertOwnership(id, userId);

        // O sistema vem do registro salvo, nunca do corpo: trocar de sistema
        // não é uma atualização (conversão de ficha seria uma feature própria).
        const system = resolveBackendSystem(existing.system);

        const envelope = envelopeUpdateSchema.safeParse(body);
        if (!envelope.success) throw zodToBadRequest(envelope.error);

        const merged = {...this.currentData(existing, system), ...extractData(body)};
        const parsed = system.dataSchema.safeParse(merged);
        if (!parsed.success) throw zodToBadRequest(parsed.error);

        const data = parsed.data;
        const level = envelope.data.level ?? existing.level;

        const record = await this.repo.update(id, {
            name: envelope.data.name ?? existing.name,
            level,
            isShared: envelope.data.isShared ?? existing.isShared,
            schemaVersion: system.schemaVersion,
            data,
            card: system.buildCard(data, level),
            ...legacyColumnsFor(system.id, data),
        });
        return toWire(record);
    }

    async remove(id: string, userId: string): Promise<void> {
        await this.assertOwnership(id, userId);
        return this.repo.delete(id);
    }

    async removeAllByUser(userId: string): Promise<void> {
        return this.repo.deleteAllByUser(userId);
    }

    // -------------------------------------------------------------------------

    private async assertOwnership(id: string, userId: string): Promise<CharacterRecord> {
        const character = await this.repo.findById(id);
        if (!character) {
            throw new NotFoundException(`Ficha ${id} não encontrada`);
        }

        if (character.userId && character.userId !== userId) {
            throw new ForbiddenException('Você não tem acesso a esta ficha.');
        }

        return character;
    }

    /** Blob atual, migrado em memória se tiver sido salvo numa versão anterior. */
    private currentData(record: CharacterRecord, system: BackendSystemDefinition): SheetData {
        const data = (record.data ?? {}) as SheetData;
        if (record.schemaVersion < system.schemaVersion && system.migrate) {
            return system.migrate(data, record.schemaVersion);
        }
        return data;
    }

    private present(record: CharacterRecord): WireSheet {
        const system = resolveBackendSystem(record.system);
        return toWire({
            ...record,
            data: this.currentData(record, system),
            schemaVersion: system.schemaVersion,
        });
    }
}
