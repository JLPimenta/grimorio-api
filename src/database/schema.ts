import {boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar,} from 'drizzle-orm/pg-core';

export const characters = pgTable('characters', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', {length: 255}).notNull(),
    class: varchar('class', {length: 100}).default(''),
    level: integer('level').notNull().default(1),
    species: varchar('species', {length: 100}).default(''),
    subclass: varchar('subclass', {length: 100}).default(''),
    background: varchar('background', {length: 100}).default(''),
    xp: integer('xp').notNull().default(0),

    abilities: jsonb('abilities').notNull(),
    skills: jsonb('skills').notNull(),

    armorClass: integer('armor_class').notNull().default(10),
    hitPoints: jsonb('hit_points').notNull(),
    hitDice: jsonb('hit_dice').notNull(),
    deathSaves: jsonb('death_saves').notNull(),
    speed: integer('speed').notNull().default(30),
    size: varchar('size', {length: 50}).default('Médio'),
    heroicInspiration: boolean('heroic_inspiration').default(false),

    weapons: jsonb('weapons').notNull().default([]),
    spells: jsonb('spells').notNull().default([]),
    spellSlots: jsonb('spell_slots').notNull(),
    spellcastingAbility: varchar('spellcasting_ability', {length: 50}).default(''),

    inventory: jsonb('inventory').notNull().default([]),
    attunedItems: jsonb('attuned_items').notNull().default([]),
    coins: jsonb('coins').notNull(),

    classFeatures: jsonb('class_features').notNull().default([]),
    speciesTraits: text('species_traits').default(''),
    feats: text('feats').default(''),
    armorTraining: varchar('armor_training', {length: 255}).default(''),
    weaponTraining: varchar('weapon_training', {length: 255}).default(''),
    toolTraining: varchar('tool_training', {length: 255}).default(''),

    personalityAndHistory: text('personality_and_history').default(''),
    alignment: varchar('alignment', {length: 100}).default(''),
    languages: text('languages').default(''),

    campaignNotes: jsonb('campaign_notes').notNull().default([]),
    customFields: jsonb('custom_fields').notNull().default([]),

    bonuses: jsonb('bonuses').notNull().default({
        proficiencyBonus: 0,
        initiative: 0,
        savingThrows: {},
        skills: {},
    }),

    userId: uuid('user_id'),           // nullable — fase 2
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type CharacterRecord = typeof characters.$inferSelect;
export type NewCharacterRecord = typeof characters.$inferInsert;
export type BasicCharacterRecord = Pick<CharacterRecord, 'id' | 'name' | 'class' | 'subclass' | 'species' | 'level' | 'hitPoints' | 'createdAt' | 'updatedAt' | 'userId'>
export type SharedCharacterRecord = Pick<CharacterRecord, 'id' | 'name' | 'class' | 'level' | 'species' | 'background' | 'subclass' | 'abilities' | 'skills' | 'armorClass' | 'hitPoints' | 'speed' | 'weapons' | 'spells' | 'classFeatures' | 'speciesTraits' | 'feats' | 'hitDice' | 'deathSaves' | 'spellSlots' | 'spellcastingAbility' | 'bonuses' | 'personalityAndHistory' | 'alignment' | 'languages'>

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