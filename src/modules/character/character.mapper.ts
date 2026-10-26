import {BadRequestException} from '@nestjs/common';
import type {ZodError} from 'zod';
import {BasicCharacterRecord, CharacterRecord} from '../../database/schema';
import {CharacterCardData, ENVELOPE_KEYS, SheetData} from './systems/system.types';

/*
 * Conversão entre o formato de banco e o formato "wire" (API <-> frontend).
 *
 * Banco: envelope em colunas (system, name, level, card, isShared...) + `data` (JSONB).
 * Wire:  ficha achatada — { id, system, name, level, ...data } — exatamente como
 *        o frontend já trabalhava, para não mexer na lógica de patch/auto-save.
 *
 * Esta é a ÚNICA fronteira onde os dois formatos se encontram.
 */

export type CharacterListItem = Pick<
    BasicCharacterRecord,
    'id' | 'system' | 'name' | 'level' | 'isShared' | 'createdAt' | 'updatedAt'
> & { card: CharacterCardData };

export type WireSheet = SheetData & {
    id: string;
    system: string;
    schemaVersion: number;
    name: string;
    level: number;
    isShared: boolean;
    card: CharacterCardData;
    createdAt: Date;
    updatedAt: Date;
};

export function toListItem(record: BasicCharacterRecord): CharacterListItem {
    return {
        id: record.id,
        system: record.system,
        name: record.name,
        level: record.level,
        isShared: record.isShared,
        card: record.card as CharacterCardData,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}

export function toWire(record: CharacterRecord): WireSheet {
    return {
        ...((record.data ?? {}) as SheetData),
        // O envelope vem por último: nada dentro do blob consegue sobrescrevê-lo.
        id: record.id,
        system: record.system,
        schemaVersion: record.schemaVersion,
        name: record.name,
        level: record.level,
        isShared: record.isShared,
        card: record.card as CharacterCardData,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}

/**
 * Separa o conteúdo da ficha do envelope e descarta valores null/undefined.
 * null significa "não informado" — o valor salvo anteriormente é mantido.
 * (O DTO antigo tratava null como ausente via @IsOptional.)
 */
export function extractData(body: Record<string, unknown>): SheetData {
    const data: SheetData = {};
    const envelope = new Set<string>(ENVELOPE_KEYS);
    for (const [key, value] of Object.entries(body)) {
        if (envelope.has(key) || value === null || value === undefined) continue;
        data[key] = value;
    }
    return data;
}

export function assertPlainObject(body: unknown): asserts body is Record<string, unknown> {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        throw new BadRequestException('O corpo da requisição deve ser um objeto JSON.');
    }
}

/** Converte erros do Zod em mensagens legíveis para a UI. */
export function zodToBadRequest(error: ZodError): BadRequestException {
    const messages = error.issues.map(issue => {
        const path = issue.path.join('.');
        // Mensagens customizadas (ex.: limites de texto) já são legíveis.
        if (issue.code === 'too_big' || issue.code === 'custom') return issue.message;
        return path ? `Campo "${path}" com valor inválido.` : 'Ficha com formato inválido.';
    });
    return new BadRequestException(messages);
}
