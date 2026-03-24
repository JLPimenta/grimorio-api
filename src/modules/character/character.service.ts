import { Injectable, NotFoundException } from '@nestjs/common';
import { CharacterRepository } from './character.repository';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { buildDefaultCharacter } from './character.defaults';
import { CharacterRecord } from '../../database/schema';

@Injectable()
export class CharacterService {
    constructor(private readonly repo: CharacterRepository) {}

    findAll(): Promise<CharacterRecord[]> {
        return this.repo.findAll();
    }

    async findById(id: string): Promise<CharacterRecord> {
        const character = await this.repo.findById(id);
        if (!character) {
            throw new NotFoundException(`Ficha ${id} não encontrada`);
        }
        return character;
    }

    create(dto: CreateCharacterDto): Promise<CharacterRecord> {
        const defaults = buildDefaultCharacter(dto.name);
        return this.repo.save(defaults);
    }

    async update(
        id: string,
        dto: UpdateCharacterDto,
    ): Promise<CharacterRecord> {
        const existing = await this.findById(id);
        return this.repo.save({
            ...existing,
            ...dto,
            id,
            updatedAt: new Date(),
        });
    }

    async remove(id: string): Promise<void> {
        await this.findById(id);
        return this.repo.delete(id);
    }
}