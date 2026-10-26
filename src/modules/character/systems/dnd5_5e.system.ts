import {z} from 'zod';
import {BackendSystemDefinition, CharacterCardData, SheetData} from './system.types';

/*
 * D&D 5.5e (regras de 2024).
 *
 * Gêmeo no frontend: src/systems/dnd5_5e/ (layout, cálculos, createDefault).
 * O formato de `data` aqui é a fonte de verdade da persistência.
 */

// ---------------------------------------------------------------------------
// Defaults (antes em character.defaults.ts)
// ---------------------------------------------------------------------------

const DEFAULT_SKILLS: Array<[string, string]> = [
    ['Acrobacia', 'dexterity'],
    ['Arcanismo', 'intelligence'],
    ['Atletismo', 'strength'],
    ['Atuação', 'charisma'],
    ['Enganação', 'charisma'],
    ['Furtividade', 'dexterity'],
    ['História', 'intelligence'],
    ['Intimidação', 'charisma'],
    ['Intuição', 'wisdom'],
    ['Investigação', 'intelligence'],
    ['Lidar com Animais', 'wisdom'],
    ['Medicina', 'wisdom'],
    ['Natureza', 'intelligence'],
    ['Percepção', 'wisdom'],
    ['Persuasão', 'charisma'],
    ['Prestidigitação', 'dexterity'],
    ['Religião', 'intelligence'],
    ['Sobrevivência', 'wisdom'],
];

const ABILITY_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

function buildDefaultData(): SheetData {
    return {
        class: '',
        species: '',
        subclass: '',
        background: '',
        xp: 0,
        abilities: Object.fromEntries(ABILITY_KEYS.map(k => [k, {value: 10, proficient: false}])),
        skills: DEFAULT_SKILLS.map(([name, ability]) => ({name, ability, proficient: false, expertise: false})),
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
        classFeatures: [],
        speciesTraits: '',
        feats: '',
        armorTraining: '',
        weaponTraining: '',
        toolTraining: '',
        personalityAndHistory: '',
        alignment: '',
        languages: '',
        campaignNotes: [],
        customFields: [],
        bonuses: {proficiencyBonus: 0, initiative: 0, savingThrows: {}, skills: {}},
    };
}

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------
// Fase 1 espelha o UpdateCharacterDto antigo: tipo no primeiro nível e limites
// de tamanho dos campos de texto (antes garantidos também pelos varchar da
// tabela). O conteúdo interno de objetos/arrays continua livre, como era.
// Endurecer campo a campo é dívida declarada — cada campo com schema estrito
// é um campo a menos sujeito a corrupção silenciosa no JSONB.
//
// As mensagens de limite contêm "texto" e "limite" de propósito: a página da
// ficha usa essas palavras para mostrar o aviso de campo longo demais.

const text = (max: number, label: string) =>
    z.string().max(max, {message: `O campo de texto "${label}" excede o limite de ${max} caracteres.`});

const int = z.number().int();
const obj = z.record(z.string(), z.unknown());
const list = z.array(z.unknown());

const defaults = buildDefaultData();

const dataSchema = z.object({
    class: text(100, 'Classe').default(''),
    species: text(100, 'Espécie').default(''),
    subclass: text(100, 'Subclasse').default(''),
    background: text(100, 'Antecedente').default(''),
    xp: int.min(0).default(0),

    abilities: obj.default(defaults.abilities as Record<string, unknown>),
    skills: list.default(defaults.skills as unknown[]),

    armorClass: int.default(10),
    hitPoints: obj.default(defaults.hitPoints as Record<string, unknown>),
    hitDice: obj.default(defaults.hitDice as Record<string, unknown>),
    deathSaves: obj.default(defaults.deathSaves as Record<string, unknown>),
    speed: int.default(30),
    size: text(50, 'Tamanho').default('Médio'),
    heroicInspiration: z.boolean().default(false),

    weapons: list.default([]),
    spells: list.default([]),
    spellSlots: obj.default(defaults.spellSlots as Record<string, unknown>),
    spellcastingAbility: text(50, 'Atributo de Conjuração').default(''),

    inventory: list.default([]),
    attunedItems: list.default([]),
    coins: obj.default(defaults.coins as Record<string, unknown>),

    classFeatures: list.default([]),
    speciesTraits: text(5_000, 'Traços de Espécie').default(''),
    feats: text(5_000, 'Talentos').default(''),
    armorTraining: text(255, 'Treinamento com Armaduras').default(''),
    weaponTraining: text(255, 'Treinamento com Armas').default(''),
    toolTraining: text(255, 'Treinamento com Ferramentas').default(''),

    personalityAndHistory: text(10_000, 'História e Personalidade').default(''),
    alignment: text(100, 'Alinhamento').default(''),
    languages: text(500, 'Idiomas').default(''),

    campaignNotes: list.default([]),
    customFields: list.default([]),

    bonuses: obj.default(defaults.bonuses as Record<string, unknown>),
});

// ---------------------------------------------------------------------------
// Card do dashboard
// ---------------------------------------------------------------------------

/** Mesma tabela de getProficiencyBonus do frontend (utils/calculations.ts). */
export function proficiencyBonusForLevel(level: number): number {
    if (level <= 4) return 2;
    if (level <= 8) return 3;
    if (level <= 12) return 4;
    if (level <= 16) return 5;
    return 6;
}

const asText = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const asNumber = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

function buildCard(data: SheetData, level: number): CharacterCardData {
    const cls = asText(data.class);
    const subclass = asText(data.subclass);
    const species = asText(data.species);
    const hp = (data.hitPoints ?? {}) as Record<string, unknown>;

    const details: CharacterCardData['details'] = [];
    if (cls) details.push({kind: 'class', text: subclass ? `${cls} — ${subclass}` : cls});
    if (species) details.push({kind: 'origin', text: species});

    return {
        details,
        stats: [
            `Proficiência +${proficiencyBonusForLevel(level)}`,
            `PV ${asNumber(hp.current)}/${asNumber(hp.max)}`,
        ],
    };
}

export const dnd55Backend: BackendSystemDefinition = {
    id: 'dnd5_5e',
    schemaVersion: 1,
    buildDefaultData,
    dataSchema: dataSchema as unknown as BackendSystemDefinition['dataSchema'],
    buildCard,
};
