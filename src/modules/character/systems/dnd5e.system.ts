import {z} from 'zod';
import {BackendSystemDefinition, CharacterCardData, SheetData} from './system.types';
import {asNumber, asText, buildDndCoreDefaults, dndCoreFields, int, proficiencyBonusForLevel, SkillSeed, text} from './dnd-common';

/*
 * D&D 5e (regras de 2014), pela ficha oficial traduzida (Biblioteca Élfica).
 *
 * Gêmeo no frontend: src/systems/dnd5e/. Modelo próprio, separado do 5.5e;
 * só a mecânica comum vem de dnd-common.ts. Os campos próprios desta edição
 * já nascem com validação estrita (não há dado legado a preservar).
 */

/** Tradução da ficha 2014: "Blefar" em vez de "Enganação". */
const SKILLS_5E: SkillSeed[] = [
    ['Acrobacia', 'dexterity'],
    ['Arcanismo', 'intelligence'],
    ['Atletismo', 'strength'],
    ['Atuação', 'charisma'],
    ['Blefar', 'charisma'],
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

function buildDefaultData(): SheetData {
    return {
        class: '',
        background: '',
        playerName: '',
        race: '',
        alignment: '',
        xp: 0,
        ...buildDndCoreDefaults(SKILLS_5E),
        personalityTraits: '',
        ideals: '',
        bonds: '',
        flaws: '',
        proficienciesAndLanguages: '',
        features: [],
        characteristics: {age: '', height: '', weight: '', eyes: '', skin: '', hair: ''},
        appearance: '',
        backstory: '',
        alliesAndOrganizations: '',
        treasure: '',
    };
}

const shortText = (label: string) => text(50, label).default('');

const dataSchema = z.object({
    class: text(100, 'Classe').default(''),
    background: text(100, 'Antecedente').default(''),
    playerName: text(100, 'Jogador').default(''),
    race: text(100, 'Raça').default(''),
    alignment: text(100, 'Tendência').default(''),
    xp: int.min(0).default(0),

    ...dndCoreFields(buildDefaultData()),

    personalityTraits: text(2_000, 'Traços de Personalidade').default(''),
    ideals: text(2_000, 'Ideais').default(''),
    bonds: text(2_000, 'Ligações').default(''),
    flaws: text(2_000, 'Defeitos').default(''),
    proficienciesAndLanguages: text(2_000, 'Idiomas e Outras Proficiências').default(''),

    features: z.array(z.object({
        id: z.string().min(1).max(64),
        name: text(120, 'Nome da característica'),
        description: text(5_000, 'Descrição da característica'),
    })).max(300).default([]),

    characteristics: z.object({
        age: shortText('Idade'),
        height: shortText('Altura'),
        weight: shortText('Peso'),
        eyes: shortText('Olhos'),
        skin: shortText('Pele'),
        hair: shortText('Cabelos'),
    }).default({age: '', height: '', weight: '', eyes: '', skin: '', hair: ''}),
    appearance: text(10_000, 'Aparência').default(''),
    backstory: text(10_000, 'História').default(''),
    alliesAndOrganizations: text(10_000, 'Aliados e Organizações').default(''),
    treasure: text(10_000, 'Tesouro').default(''),
});

function buildCard(data: SheetData, level: number): CharacterCardData {
    const cls = asText(data.class);
    const race = asText(data.race);
    const hp = (data.hitPoints ?? {}) as Record<string, unknown>;

    const details: CharacterCardData['details'] = [];
    if (cls) details.push({kind: 'class', text: cls});
    if (race) details.push({kind: 'origin', text: race});

    return {
        details,
        stats: [
            `Proficiência +${proficiencyBonusForLevel(level)}`,
            `PV ${asNumber(hp.current)}/${asNumber(hp.max)}`,
        ],
    };
}

export const dnd5eBackend: BackendSystemDefinition = {
    id: 'dnd5e',
    schemaVersion: 1,
    buildDefaultData,
    dataSchema: dataSchema as unknown as BackendSystemDefinition['dataSchema'],
    buildCard,
};
