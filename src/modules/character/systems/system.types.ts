import type {ZodType} from 'zod';

/**
 * Identificadores de sistema. São persistidos na coluna `characters.system`:
 * nunca renomear um id existente sem migração de dados.
 *
 * Gêmeo no frontend: src/systems/types.ts (SystemId) — manter em sincronia.
 */
export const SYSTEM_IDS = ['dnd5_5e', 'dnd5e', 'tormenta20'] as const;
export type SystemId = (typeof SYSTEM_IDS)[number];

export const DEFAULT_SYSTEM_ID: SystemId = 'dnd5_5e';

/**
 * Chaves do envelope. Nunca são persistidas dentro de `data`:
 * ou viram colunas próprias, ou são metadados controlados pelo servidor.
 */
export const ENVELOPE_KEYS = [
    'id', 'system', 'schemaVersion', 'name', 'level', 'card',
    'userId', 'isShared', 'createdAt', 'updatedAt',
] as const;

/**
 * Resumo exibido no card do dashboard. Derivado no servidor a cada save
 * e salvo na coluna `card`, para que a listagem não precise abrir o blob.
 * Gêmeo no frontend: src/systems/types.ts (CharacterCardData).
 */
export interface CharacterCardData {
    /** Linhas descritivas. `kind` decide o ícone no frontend. */
    details: { kind: 'class' | 'origin'; text: string }[];
    /** Estatísticas curtas, já formatadas. Ex: "PV 10/10" */
    stats: string[];
}

export type SheetData = Record<string, unknown>;

/**
 * Contrato que cada sistema implementa no backend. O backend não renderiza
 * nada: valida, gera defaults e deriva o card. Toda regra de sistema mora
 * em `systems/<id>.system.ts`; o restante do módulo é agnóstico.
 */
export interface BackendSystemDefinition {
    id: SystemId;

    /** Versão atual do formato de `data`. Incrementar ao mudar o formato. */
    schemaVersion: number;

    /** Conteúdo default de uma ficha nova (apenas o que vai em `data`). */
    buildDefaultData: () => SheetData;

    /**
     * Valida o blob completo (já mesclado com o que estava salvo).
     * Chaves desconhecidas são descartadas, como o `whitelist` do
     * ValidationPipe fazia com o DTO antigo.
     */
    dataSchema: ZodType<SheetData>;

    /**
     * Migra um blob de `schemaVersion` anterior para o formato atual.
     * Opcional enquanto o sistema estiver na versão 1.
     */
    migrate?: (data: SheetData, fromVersion: number) => SheetData;

    /** Card do dashboard, derivado do conteúdo e do nível. */
    buildCard: (data: SheetData, level: number) => CharacterCardData;
}
