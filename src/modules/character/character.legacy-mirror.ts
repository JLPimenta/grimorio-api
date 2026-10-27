import {BasicCharacterRecord, NewCharacterRecord} from '../../database/schema';
import {SheetData} from './systems/system.types';

/*
 * ⚠ TRANSITÓRIO — apagar junto com a migration de limpeza das colunas legadas.
 *
 * Enquanto as colunas antigas de 5.5e existirem, o backend continua gravando
 * nelas uma cópia do blob. Motivo: se for preciso voltar para a versão
 * anterior da API depois da migration aditiva, a versão antiga lê as colunas
 * legadas — sem este espelho, ela veria as fichas como estavam no deploy e
 * qualquer edição feita depois seria perdida.
 *
 * Só se aplica a fichas dnd5_5e; outros sistemas deixam as colunas nulas.
 */
/**
 * Campos que o dashboard do frontend ANTERIOR à Fase 1 lê de cada item da
 * listagem (`character.hitPoints.current` sem checagem). Sem eles, um frontend
 * antigo — deploy fora de ordem ou aba aberta antes da atualização — quebra a
 * tela inteira com "Cannot read properties of undefined (reading 'current')".
 * Fichas de outros sistemas recebem valores neutros.
 */
export function legacyListFields(record: BasicCharacterRecord) {
    return {
        class: record.class ?? '',
        subclass: record.subclass ?? '',
        species: record.species ?? '',
        hitPoints: (record.hitPoints as object | null | undefined) ?? {current: 0, max: 0, temp: 0},
    };
}

export function legacyColumnsFor(system: string, data: SheetData): Partial<NewCharacterRecord> {
    if (system !== 'dnd5_5e') return {};
    const d = data as Record<string, any>;
    return {
        class: d.class,
        species: d.species,
        subclass: d.subclass,
        background: d.background,
        xp: d.xp,
        abilities: d.abilities,
        skills: d.skills,
        armorClass: d.armorClass,
        hitPoints: d.hitPoints,
        hitDice: d.hitDice,
        deathSaves: d.deathSaves,
        speed: d.speed,
        size: d.size,
        heroicInspiration: d.heroicInspiration,
        weapons: d.weapons,
        spells: d.spells,
        spellSlots: d.spellSlots,
        spellcastingAbility: d.spellcastingAbility,
        inventory: d.inventory,
        attunedItems: d.attunedItems,
        coins: d.coins,
        classFeatures: d.classFeatures,
        speciesTraits: d.speciesTraits,
        feats: d.feats,
        armorTraining: d.armorTraining,
        weaponTraining: d.weaponTraining,
        toolTraining: d.toolTraining,
        personalityAndHistory: d.personalityAndHistory,
        alignment: d.alignment,
        languages: d.languages,
        campaignNotes: d.campaignNotes,
        customFields: d.customFields,
        bonuses: d.bonuses,
    };
}
