import {
    IsString, IsInt, IsOptional, IsObject,
    IsArray, IsBoolean, Min, Max,
} from 'class-validator';

export class UpdateCharacterDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    class?: string;

    @IsInt()
    @Min(1)
    @Max(20)
    @IsOptional()
    level?: number;

    @IsString()
    @IsOptional()
    species?: string;

    @IsString()
    @IsOptional()
    subclass?: string;

    @IsString()
    @IsOptional()
    background?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    xp?: number;

    @IsObject()
    @IsOptional()
    abilities?: Record<string, any>;

    @IsArray()
    @IsOptional()
    skills?: any[];

    @IsInt()
    @IsOptional()
    armorClass?: number;

    @IsObject()
    @IsOptional()
    hitPoints?: Record<string, number>;

    @IsObject()
    @IsOptional()
    hitDice?: Record<string, any>;

    @IsObject()
    @IsOptional()
    deathSaves?: { successes: number; failures: number };

    @IsInt()
    @IsOptional()
    speed?: number;

    @IsString()
    @IsOptional()
    size?: string;

    @IsBoolean() @IsOptional() heroicInspiration?: boolean;

    @IsArray()  @IsOptional() weapons?: any[];
    @IsArray()  @IsOptional() spells?: any[];
    @IsObject() @IsOptional() spellSlots?: Record<string, any>;
    @IsString() @IsOptional() spellcastingAbility?: string;

    @IsArray()  @IsOptional() inventory?: any[];
    @IsArray()  @IsOptional() attunedItems?: any[];
    @IsObject() @IsOptional() coins?: Record<string, number>;

    @IsArray()  @IsOptional() classFeatures?: string[];
    @IsString() @IsOptional() speciesTraits?: string;
    @IsString() @IsOptional() feats?: string;
    @IsString() @IsOptional() armorTraining?: string;
    @IsString() @IsOptional() weaponTraining?: string;
    @IsString() @IsOptional() toolTraining?: string;

    @IsString() @IsOptional() personalityAndHistory?: string;
    @IsString() @IsOptional() alignment?: string;
    @IsString() @IsOptional() languages?: string;

    @IsArray()  @IsOptional() campaignNotes?: any[];
    @IsArray()  @IsOptional() customFields?: any[];

    @IsObject() @IsOptional() bonuses?: {
        proficiencyBonus?: number;
        initiative?:       number;
        savingThrows?:     Record<string, number>;
        skills?:           Record<string, number>;
    };
}