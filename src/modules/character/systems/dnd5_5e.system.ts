import {z} from 'zod';
import {BackendSystemDefinition, CharacterCardData, SheetData} from './system.types';
import {
    asNumber, asText, buildDndCoreDefaults, dndCoreFields, int, list, proficiencyBonusForLevel, SkillSeed, text,
} from './dnd-common';

/*
 * D&D 5.5e (regras de 2024).
 *
 * Gêmeo no frontend: src/systems/dnd5_5e/ (layout, cálculos, createDefault).
 * Os campos da mecânica comum à família D&D vêm de dnd-common.ts; aqui ficam
 * só os campos próprios da edição de 2024.
 */

const SKILLS_55E: SkillSeed[] = [
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

function buildDefaultData(): SheetData {
    return {
        class: '',
        species: '',
        subclass: '',
        background: '',
        xp: 0,
        ...buildDndCoreDefaults(SKILLS_55E),
        classFeatures: [],
        speciesTraits: '',
        feats: '',
        armorTraining: '',
        weaponTraining: '',
        toolTraining: '',
        personalityAndHistory: '',
        alignment: '',
        languages: '',
    };
}

const dataSchema = z.object({
    class: text(100, 'Classe').default(''),
    species: text(100, 'Espécie').default(''),
    subclass: text(100, 'Subclasse').default(''),
    background: text(100, 'Antecedente').default(''),
    xp: int.min(0).default(0),

    ...dndCoreFields(buildDefaultData()),

    classFeatures: list.default([]),
    speciesTraits: text(5_000, 'Traços de Espécie').default(''),
    feats: text(5_000, 'Talentos').default(''),
    armorTraining: text(255, 'Treinamento com Armaduras').default(''),
    weaponTraining: text(255, 'Treinamento com Armas').default(''),
    toolTraining: text(255, 'Treinamento com Ferramentas').default(''),

    personalityAndHistory: text(10_000, 'História e Personalidade').default(''),
    alignment: text(100, 'Alinhamento').default(''),
    languages: text(500, 'Idiomas').default(''),
});

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

export {proficiencyBonusForLevel};

export const dnd55Backend: BackendSystemDefinition = {
    id: 'dnd5_5e',
    schemaVersion: 1,
    buildDefaultData,
    dataSchema: dataSchema as unknown as BackendSystemDefinition['dataSchema'],
    buildCard,
};
