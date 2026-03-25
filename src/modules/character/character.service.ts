import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {CharacterRepository} from './character.repository';
import {CreateCharacterDto} from './dto/create-character.dto';
import {UpdateCharacterDto} from './dto/update-character.dto';
import {buildDefaultCharacter} from './character.defaults';
import {BasicCharacterRecord, CharacterRecord} from '../../database/schema';

@Injectable()
export class CharacterService {
    constructor(private readonly repo: CharacterRepository) {
    }

    findAll(userId: string): Promise<BasicCharacterRecord[]> {
        return this.repo.findAll(userId);
    }

    async findById(id: string): Promise<CharacterRecord> {
        const character = await this.repo.findById(id);
        if (!character) {
            throw new NotFoundException(`Ficha ${id} não encontrada`);
        }
        return character;
    }

    async assertOwnership(id: string, userId: string): Promise<CharacterRecord> {
        const character = await this.findById(id);

        if (character.userId && character.userId !== userId) {
            throw new ForbiddenException('Você não tem acesso a esta ficha.');
        }

        return character;
    }

    create(dto: CreateCharacterDto, userId: string): Promise<CharacterRecord> {
        const defaults = buildDefaultCharacter(dto.name);
        return this.repo.save({...defaults, userId: userId});
    }

    async update(id: string, dto: UpdateCharacterDto, userId: string): Promise<CharacterRecord> {
        await this.assertOwnership(id, userId)
        const existing = await this.findById(id);

        return this.repo.save({
            ...existing,
            ...dto,
            id,
            updatedAt: new Date(),
        });
    }

    async remove(id: string, userId: string): Promise<void> {
        await this.assertOwnership(id, userId).then(() => {
            this.findById(id)
        });
        return this.repo.delete(id);
    }

    removeAllByUser(userId: string): Promise<void> {
        return this.repo.deleteAllByUser(userId);
    }
}