import {boolean, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar,} from 'drizzle-orm/pg-core';

export const characters = pgTable('characters', {
    id: uuid('id').primaryKey().defaultRandom(),

    // ---- Envelope (agnóstico de sistema) ----------------------------------
    /** Sistema de jogo da ficha. Imutável depois de criada. */
    system: varchar('system', {length: 50}).notNull().default('dnd5_5e'),
    /** Versão do formato de `data` para este sistema (migração lazy). */
    schemaVersion: integer('schema_version').notNull().default(1),
    name: varchar('name', {length: 255}).notNull(),
    level: integer('level').notNull().default(1),
    /** Resumo do card do dashboard, derivado no servidor a cada save. */
    card: jsonb('card').notNull().default({details: [], stats: []}),

    // ---- Conteúdo da ficha (formato definido pelo sistema) -----------------
    data: jsonb('data').notNull(),

    // ---- Metadados ---------------------------------------------------------
    userId: uuid('user_id'),           // nullable — fase 2
    isShared: boolean('is_shared').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),

    // ---- LEGADO (D&D 5.5e) -------------------------------------------------
    // @deprecated Substituídas por `data`. Mantidas (agora anuláveis) apenas
    // para permitir rollback da API durante a transição; o backend ainda as
    // espelha em character.legacy-mirror.ts. Remover na migration de limpeza:
    // apagar este bloco + o espelho e rodar `npm run db:generate`.
    class: varchar('class', {length: 100}).default(''),
    species: varchar('species', {length: 100}).default(''),
    subclass: varchar('subclass', {length: 100}).default(''),
    background: varchar('background', {length: 100}).default(''),
    xp: integer('xp').default(0),
    abilities: jsonb('abilities'),
    skills: jsonb('skills'),
    armorClass: integer('armor_class').default(10),
    hitPoints: jsonb('hit_points'),
    hitDice: jsonb('hit_dice'),
    deathSaves: jsonb('death_saves'),
    speed: integer('speed').default(30),
    size: varchar('size', {length: 50}).default('Médio'),
    heroicInspiration: boolean('heroic_inspiration').default(false),
    weapons: jsonb('weapons').default([]),
    spells: jsonb('spells').default([]),
    spellSlots: jsonb('spell_slots'),
    spellcastingAbility: varchar('spellcasting_ability', {length: 50}).default(''),
    inventory: jsonb('inventory').default([]),
    attunedItems: jsonb('attuned_items').default([]),
    coins: jsonb('coins'),
    classFeatures: jsonb('class_features').default([]),
    speciesTraits: text('species_traits').default(''),
    feats: text('feats').default(''),
    armorTraining: varchar('armor_training', {length: 255}).default(''),
    weaponTraining: varchar('weapon_training', {length: 255}).default(''),
    toolTraining: varchar('tool_training', {length: 255}).default(''),
    personalityAndHistory: text('personality_and_history').default(''),
    alignment: varchar('alignment', {length: 100}).default(''),
    languages: text('languages').default(''),
    campaignNotes: jsonb('campaign_notes').default([]),
    customFields: jsonb('custom_fields').default([]),
    bonuses: jsonb('bonuses').default({
        proficiencyBonus: 0,
        initiative: 0,
        savingThrows: {},
        skills: {},
    }),
}, (t) => [
    index('idx_characters_user_updated').on(t.userId, t.updatedAt),
]);

export type CharacterRecord = typeof characters.$inferSelect;
export type NewCharacterRecord = typeof characters.$inferInsert;
export type BasicCharacterRecord = Pick<CharacterRecord, 'id' | 'system' | 'name' | 'level' | 'card' | 'createdAt' | 'updatedAt' | 'userId' | 'isShared'>

export const users = pgTable('users', {
    id:            uuid('id').primaryKey().defaultRandom(),
    name:          varchar('name', { length: 255 }).notNull(),
    email:         varchar('email', { length: 255 }).notNull().unique(),
    passwordHash:  varchar('password_hash', { length: 255 }), // nullable for Google
    avatarUrl:     varchar('avatar_url', { length: 500 }),
    googleId:      varchar('google_id', { length: 255 }).unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    preferences:    jsonb('preferences').notNull().default({}),

    emailConfirmToken:   varchar('email_confirm_token', { length: 255 }),
    passwordResetToken:  varchar('password_reset_token', { length: 255 }),
    passwordResetExpiry: timestamp('password_reset_expiry'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type UserRecord    = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;