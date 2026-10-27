import {z} from 'zod';
import {SheetData} from './system.types';

/*
 * Núcleo da família D&D (5e de 2014 e 5.5e de 2024) no backend.
 *
 * As duas edições têm schemas próprios, mas os campos da mecânica que é
 * idêntica nas duas (atributos, perícias, CA, PV, magias, moedas...) são
 * validados igual. Gêmeo no frontend: src/systems/dnd-common/types.ts
 * (DndCoreSheet) e as seções compartilhadas de components/sheet/.
 *
 * Regra: um campo só entra aqui se tiver o MESMO formato e a MESMA regra nas
 * duas edições. O resto fica no arquivo de cada sistema.
 */

// ---------------------------------------------------------------------------
// Validadores reaproveitáveis
// ---------------------------------------------------------------------------

/**
 * Texto com limite. A mensagem contém "texto" e "limite" de propósito: a
 * página da ficha usa essas palavras para mostrar o aviso de campo longo.
 */
export const text = (max: number, label: string) =>
    z.string().max(max, {message: `O campo de texto "${label}" excede o limite de ${max} caracteres.`});

export const int = z.number().int();
export const obj = z.record(z.string(), z.unknown());
export const list = z.array(z.unknown());

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export type SkillSeed = [name: string, ability: string];

const ABILITY_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

/** Conteúdo default dos campos do núcleo. Cada edição informa a própria lista de perícias. */
export function buildDndCoreDefaults(skills: SkillSeed[]): SheetData {
    return {
        abilities: Object.fromEntries(ABILITY_KEYS.map(k => [k, {value: 10, proficient: false}])),
        skills: skills.map(([name, ability]) => ({name, ability, proficient: false, expertise: false})),
        armorClass: 10,
        hitPoints: {current: 10, max: 10, temp: 0},
        hitDice: {total: '1d10', used: 0},
        deathSaves: {successes: 0, failures: 0},
        speed: 30,
        size: 'Médio',
        heroicInspiration: false,
        weapons: [],
        spells: [],
        spellSlots: Object.fromEntries(
            Array.from({length: 9}, (_, i) => [String(i + 1), {total: 0, used: 0}]),
        ),
        spellcastingAbility: '',
        inventory: [],
        attunedItems: [],
        coins: {cp: 0, sp: 0, ep: 0, gp: 0, pp: 0},
        campaignNotes: [],
        customFields: [],
        bonuses: {proficiencyBonus: 0, initiative: 0, savingThrows: {}, skills: {}},
    };
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
// Espelha o UpdateCharacterDto original do 5.5e: tipo no primeiro nível e
// conteúdo interno livre. Endurecer campo a campo é dívida declarada.

/** Campos do núcleo, para espalhar no z.object de cada edição. */
export function dndCoreFields(defaults: SheetData) {
    const d = defaults as Record<string, any>;
    return {
        abilities: obj.default(d.abilities),
        skills: list.default(d.skills),

        armorClass: int.default(10),
        hitPoints: obj.default(d.hitPoints),
        hitDice: obj.default(d.hitDice),
        deathSaves: obj.default(d.deathSaves),
        speed: int.default(30),
        size: text(50, 'Tamanho').default('Médio'),
        heroicInspiration: z.boolean().default(false),

        weapons: list.default([]),
        spells: list.default([]),
        spellSlots: obj.default(d.spellSlots),
        spellcastingAbility: text(50, 'Atributo de Conjuração').default(''),

        inventory: list.default([]),
        attunedItems: list.default([]),
        coins: obj.default(d.coins),

        campaignNotes: list.default([]),
        customFields: list.default([]),

        bonuses: obj.default(d.bonuses),
    };
}

// ---------------------------------------------------------------------------
// Regras
// ---------------------------------------------------------------------------

/** Mesma tabela de getProficiencyBonus do frontend (utils/calculations.ts). */
export function proficiencyBonusForLevel(level: number): number {
    if (level <= 4) return 2;
    if (level <= 8) return 3;
    if (level <= 12) return 4;
    if (level <= 16) return 5;
    return 6;
}

export const asText = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
export const asNumber = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
