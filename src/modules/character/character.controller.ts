import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Req, UseGuards} from '@nestjs/common';
import {CharacterService} from './character.service';
import {CreateCharacterDto} from './dto/create-character.dto';
import {UpdateCharacterDto} from './dto/update-character.dto';
import {OptionalJwtGuard} from "../auth/guards/optional-jwt.guard";
import {SharedCharacterRecord, UserRecord} from "../../database/schema";
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";

interface AuthRequest extends Request {
    user: UserRecord;
}

@Controller('characters')
export class CharacterController {
    constructor(private readonly service: CharacterService) {
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Req() req: AuthRequest) {
        return this.service.findAll(req.user.id);
    }

    @Get(':id/shared')
    @UseGuards(OptionalJwtGuard)
    async getShared(@Param('id') id: string): Promise<SharedCharacterRecord> {
        const full = await this.service.findById(id);
        return {
            id: full.id,
            name: full.name,
            class: full.class,
            level: full.level,
            species: full.species,
            background: full.background,
            subclass: full.subclass,
            abilities: full.abilities,
            skills: full.skills,
            armorClass: full.armorClass,
            hitPoints: full.hitPoints,
            speed: full.speed,
            weapons: full.weapons,
            spells: full.spells,
            classFeatures: full.classFeatures,
            speciesTraits: full.speciesTraits,
            personalityAndHistory: full.personalityAndHistory,
            alignment: full.alignment,
            languages: full.languages,
            feats: full.feats,
            hitDice: full.hitDice,
            deathSaves: full.deathSaves,
            spellSlots: full.spellSlots,
            spellcastingAbility: full.spellcastingAbility,
            bonuses: full.bonuses
        }
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string, @Req() req: AuthRequest) {
        return this.service.assertOwnership(id, req.user.id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body() dto: CreateCharacterDto, @Req() req: AuthRequest) {
        return this.service.create(dto, req.user.id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body() dto: UpdateCharacterDto, @Req() req: AuthRequest) {
        return this.service.update(id, dto, req.user.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    async remove(@Param('id') id: string, @Req() req: AuthRequest) {
        return this.service.remove(id, req.user.id);
    }
}