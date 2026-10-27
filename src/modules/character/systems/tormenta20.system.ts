import {z} from 'zod';
import {BackendSystemDefinition, CharacterCardData, SheetData} from './system.types';

/*
 * Tormenta20 — Edição Jogo do Ano.
 *
 * Gêmeo no frontend: src/systems/tormenta20/ (types, skills, rules, layout).
 * Referência das regras: ficha editável oficial (PDF) do Jogo do Ano.
 *
 * Diferente do 5.5e, este schema já nasce estrito no conteúdo interno:
 * não existe dado legado a preservar, então cada campo tem tipo e limite.
 */

// ---------------------------------------------------------------------------
// Catálogo de perícias (chaves iguais às do frontend: skills.ts)
// ---------------------------------------------------------------------------

const ATTRIBUTES = ['for', 'des', 'con', 'int', 'sab', 'car'] as const;
type Attribute = (typeof ATTRIBUTES)[number];

const SKILLS: Array<[key: string, attribute: Attribute, hasSpecialty?: boolean]> = [
    ['acrobacia', 'des'], ['adestramento', 'car'], ['atletismo', 'for'], ['atuacao', 'car'],
    ['cavalgar', 'des'], ['conhecimento', 'int'], ['cura', 'sab'], ['diplomacia', 'car'],
    ['enganacao', 'car'], ['fortitude', 'con'], ['furtividade', 'des'], ['guerra', 'int'],
    ['iniciativa', 'des'], ['intimidacao', 'car'], ['intuicao', 'sab'], ['investigacao', 'int'],
    ['jogatina', 'car'], ['ladinagem', 'des'], ['luta', 'for'], ['misticismo', 'int'],
    ['nobreza', 'int'], ['oficio1', 'int', true], ['oficio2', 'int', true], ['percepcao', 'sab'],
    ['pilotagem', 'des'], ['pontaria', 'des'], ['reflexos', 'des'], ['religiao', 'sab'],
    ['sobrevivencia', 'sab'], ['vontade', 'sab'],
];
const SKILL_KEYS = new Set(SKILLS.map(([key]) => key));

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function buildDefaultData(): SheetData {
    return {
        player: '',
        race: '',
        origin: '',
        class: '',
        deity: '',
        xp: 0,
        downtimePoints: 0,
        attributes: {for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0},
        skills: Object.fromEntries(SKILLS.map(([key, attribute, hasSpecialty]) => [
            key,
            {trained: false, attribute, other: 0, ...(hasSpecialty ? {specialty: ''} : {})},
        ])),
        hp: {max: 0, current: 0, temp: 0},
        mp: {max: 0, current: 0, temp: 0},
        defense: {attribute: 'des', other: 0, heavyArmor: false, attributeLimit: 0},
        armor: {name: '', bonus: 0, penalty: 0},
        shield: {name: '', bonus: 0, penalty: 0},
        size: 'medio',
        speed: '9m',
        proficiencies: '',
        attacks: [],
        raceOriginAbilities: [],
        classAbilities: [],
        spellcasting: {attribute: 'int'},
        spells: [],
        equipment: [],
        money: {ts: 0, to: 0},
        description: '',
        history: '',
        notes: '',
        campaignNotes: [],
        customFields: [],
    };
}

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

const text = (max: number, label: string) =>
    z.string().max(max, {message: `O campo de texto "${label}" excede o limite de ${max} caracteres.`});
const int = z.number().int();
const attribute = z.enum(ATTRIBUTES);
const id = z.string().min(1).max(64);

const resource = z.object({max: int.min(0), current: int, temp: int.min(0)});
const armorPiece = z.object({
    name: text(100, 'Armadura/Escudo').default(''),
    bonus: int.default(0),
    penalty: int.min(0).default(0),
});
const skillState = z.object({
    trained: z.boolean().default(false),
    attribute,
    other: int.default(0),
    specialty: text(60, 'Especialidade do Ofício').optional(),
});
const ability = z.object({
    id,
    name: text(120, 'Nome da habilidade'),
    description: text(5_000, 'Descrição da habilidade'),
});

const defaults = buildDefaultData();

const dataSchema = z.object({
    player: text(100, 'Jogador').default(''),
    race: text(100, 'Raça').default(''),
    origin: text(100, 'Origem').default(''),
    class: text(100, 'Classe').default(''),
    deity: text(100, 'Divindade').default(''),
    xp: int.min(0).default(0),
    downtimePoints: int.min(0).default(0),

    attributes: z.object({
        for: int.min(-10).max(20), des: int.min(-10).max(20), con: int.min(-10).max(20),
        int: int.min(-10).max(20), sab: int.min(-10).max(20), car: int.min(-10).max(20),
    }).default(defaults.attributes as never),

    skills: z.record(z.string(), skillState)
        .refine(skills => Object.keys(skills).every(k => SKILL_KEYS.has(k)), {message: 'Perícia desconhecida na ficha.'})
        .default(defaults.skills as never),

    hp: resource.default(defaults.hp as never),
    mp: resource.default(defaults.mp as never),

    defense: z.object({
        attribute,
        other: int.default(0),
        heavyArmor: z.boolean().default(false),
        attributeLimit: int.min(0).default(0),
    }).default(defaults.defense as never),
    armor: armorPiece.default(defaults.armor as never),
    shield: armorPiece.default(defaults.shield as never),

    size: z.enum(['minusculo', 'pequeno', 'medio', 'grande', 'enorme', 'colossal']).default('medio'),
    speed: text(50, 'Deslocamento').default('9m'),
    proficiencies: text(2_000, 'Proficiências').default(''),

    attacks: z.array(z.object({
        id,
        name: text(100, 'Ataque'),
        attackBonus: text(30, 'Teste de ataque'),
        damage: text(50, 'Dano'),
        critical: text(30, 'Crítico'),
        damageType: text(50, 'Tipo de dano'),
        range: text(50, 'Alcance'),
        notes: text(500, 'Notas do ataque').default(''),
    })).max(100).default([]),

    raceOriginAbilities: z.array(ability).max(200).default([]),
    classAbilities: z.array(ability).max(300).default([]),

    spellcasting: z.object({attribute}).default({attribute: 'int'}),
    spells: z.array(z.object({
        id,
        circle: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
        name: text(120, 'Nome da magia'),
        school: text(100, 'Escola'),
        execution: text(100, 'Execução'),
        range: text(100, 'Alcance'),
        target: text(100, 'Alvo/Área'),
        duration: text(100, 'Duração'),
        resistance: text(100, 'Resistência'),
        description: text(5_000, 'Efeito da magia'),
    })).max(1_000).default([]),

    equipment: z.array(z.object({
        id,
        name: text(120, 'Item'),
        quantity: int.min(0),
        spaces: z.number().min(0).max(1_000),
        worn: z.boolean(),
        notes: text(300, 'Notas do item'),
    })).max(500).default([]),
    money: z.object({ts: int.min(0), to: int.min(0)}).default({ts: 0, to: 0}),

    description: text(10_000, 'Descrição').default(''),
    history: text(10_000, 'Histórico').default(''),
    notes: text(10_000, 'Anotações').default(''),

    // Recursos comuns do Grimório (mesmo formato do 5.5e)
    campaignNotes: z.array(z.record(z.string(), z.unknown())).max(500).default([]),
    customFields: z.array(z.record(z.string(), z.unknown())).max(500).default([]),
});

// ---------------------------------------------------------------------------
// Card do dashboard
// ---------------------------------------------------------------------------

const asText = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const asNumber = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

function buildCard(data: SheetData): CharacterCardData {
    const cls = asText(data.class);
    const origin = [asText(data.race), asText(data.origin)].filter(Boolean).join(' · ');
    const hp = (data.hp ?? {}) as Record<string, unknown>;
    const mp = (data.mp ?? {}) as Record<string, unknown>;

    const details: CharacterCardData['details'] = [];
    if (cls) details.push({kind: 'class', text: cls});
    if (origin) details.push({kind: 'origin', text: origin});

    return {
        details,
        stats: [
            `PV ${asNumber(hp.current)}/${asNumber(hp.max)}`,
            `PM ${asNumber(mp.current)}/${asNumber(mp.max)}`,
        ],
    };
}

export const tormenta20Backend: BackendSystemDefinition = {
    id: 'tormenta20',
    schemaVersion: 1,
    buildDefaultData,
    dataSchema: dataSchema as unknown as BackendSystemDefinition['dataSchema'],
    buildCard,
};
