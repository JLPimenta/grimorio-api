ALTER TABLE "characters" ALTER COLUMN "xp" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "abilities" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "skills" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "armor_class" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "hit_points" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "hit_dice" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "death_saves" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "speed" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "weapons" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "spells" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "spell_slots" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "inventory" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "attuned_items" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "coins" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "class_features" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "campaign_notes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "custom_fields" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "bonuses" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "system" varchar(50) DEFAULT 'dnd5_5e' NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "schema_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "card" jsonb DEFAULT '{"details":[],"stats":[]}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "data" jsonb;--> statement-breakpoint
-- Backfill: dobra as colunas legadas de 5.5e para dentro do blob, com as
-- mesmas chaves camelCase do formato wire. `name` e `level` ficam fora: são
-- colunas do envelope. As colunas legadas NÃO são removidas aqui — o rollback
-- da API continua possível (ver character.legacy-mirror.ts).
UPDATE "characters" SET "data" = jsonb_build_object(
  'class',                 COALESCE("class", ''),
  'species',               COALESCE("species", ''),
  'subclass',              COALESCE("subclass", ''),
  'background',            COALESCE("background", ''),
  'xp',                    COALESCE("xp", 0),
  'abilities',             "abilities",
  'skills',                "skills",
  'armorClass',            COALESCE("armor_class", 10),
  'hitPoints',             "hit_points",
  'hitDice',               "hit_dice",
  'deathSaves',            "death_saves",
  'speed',                 COALESCE("speed", 30),
  'size',                  COALESCE("size", 'Médio'),
  'heroicInspiration',     COALESCE("heroic_inspiration", false),
  'weapons',               COALESCE("weapons", '[]'::jsonb),
  'spells',                COALESCE("spells", '[]'::jsonb),
  'spellSlots',            "spell_slots",
  'spellcastingAbility',   COALESCE("spellcasting_ability", ''),
  'inventory',             COALESCE("inventory", '[]'::jsonb),
  'attunedItems',          COALESCE("attuned_items", '[]'::jsonb),
  'coins',                 "coins",
  'classFeatures',         COALESCE("class_features", '[]'::jsonb),
  'speciesTraits',         COALESCE("species_traits", ''),
  'feats',                 COALESCE("feats", ''),
  'armorTraining',         COALESCE("armor_training", ''),
  'weaponTraining',        COALESCE("weapon_training", ''),
  'toolTraining',          COALESCE("tool_training", ''),
  'personalityAndHistory', COALESCE("personality_and_history", ''),
  'alignment',             COALESCE("alignment", ''),
  'languages',             COALESCE("languages", ''),
  'campaignNotes',         COALESCE("campaign_notes", '[]'::jsonb),
  'customFields',          COALESCE("custom_fields", '[]'::jsonb),
  'bonuses',               COALESCE("bonuses", '{"proficiencyBonus":0,"initiative":0,"savingThrows":{},"skills":{}}'::jsonb)
)
WHERE "data" IS NULL;--> statement-breakpoint
-- Card do dashboard (equivalente a dnd5_5e.system.ts → buildCard).
UPDATE "characters" SET "card" = jsonb_build_object(
  'details',
    CASE WHEN btrim(COALESCE("class", '')) <> ''
      THEN jsonb_build_array(jsonb_build_object(
        'kind', 'class',
        'text', btrim("class") || CASE WHEN btrim(COALESCE("subclass", '')) <> '' THEN ' — ' || btrim("subclass") ELSE '' END))
      ELSE '[]'::jsonb END
    ||
    CASE WHEN btrim(COALESCE("species", '')) <> ''
      THEN jsonb_build_array(jsonb_build_object('kind', 'origin', 'text', btrim("species")))
      ELSE '[]'::jsonb END,
  'stats', jsonb_build_array(
    'Proficiência +' || LEAST((GREATEST("level", 1) - 1) / 4 + 2, 6)::text,
    'PV ' || COALESCE("hit_points"->>'current', '0') || '/' || COALESCE("hit_points"->>'max', '0')
  )
)
WHERE "system" = 'dnd5_5e';--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "data" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_characters_user_updated" ON "characters" USING btree ("user_id","updated_at");