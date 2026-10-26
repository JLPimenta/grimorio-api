import {BadRequestException, ForbiddenException} from '@nestjs/common';
import {CharacterService} from './character.service';
import {CharacterRepository} from './character.repository';
import {CharacterRecord, NewCharacterRecord} from '../../database/schema';

/** Repositório em memória: exercita o service sem banco. */
class InMemoryRepo {
    rows = new Map<string, CharacterRecord>();
    private seq = 0;

    async findAll(userId: string) {
        return [...this.rows.values()].filter(r => r.userId === userId);
    }

    async findById(id: string) {
        return this.rows.get(id) ?? null;
    }

    async insert(data: NewCharacterRecord) {
        const now = new Date();
        const row = {
            id: `id-${++this.seq}`, system: 'dnd5_5e', schemaVersion: 1, level: 1,
            card: {details: [], stats: []}, userId: null, isShared: false,
            createdAt: now, updatedAt: now, ...data,
        } as CharacterRecord;
        this.rows.set(row.id, row);
        return row;
    }

    async update(id: string, patch: Partial<NewCharacterRecord>) {
        const row = {...this.rows.get(id)!, ...patch, updatedAt: new Date()} as CharacterRecord;
        this.rows.set(id, row);
        return row;
    }

    async delete(id: string) {
        this.rows.delete(id);
    }

    async deleteAllByUser() {
    }
}

describe('CharacterService (envelope multi-sistema)', () => {
    let repo: InMemoryRepo;
    let service: CharacterService;

    beforeEach(() => {
        repo = new InMemoryRepo();
        service = new CharacterService(repo as unknown as CharacterRepository);
    });

    it('cria ficha 5.5e por padrão, com envelope separado do blob', async () => {
        const sheet = await service.create({name: 'Thorin'}, 'u1');
        const row = repo.rows.get(sheet.id)!;

        expect(row.system).toBe('dnd5_5e');
        expect(row.name).toBe('Thorin');
        expect(row.data).not.toHaveProperty('name');
        expect(row.data).not.toHaveProperty('level');
        expect(sheet).toMatchObject({system: 'dnd5_5e', name: 'Thorin', level: 1, armorClass: 10});
        expect(sheet.card.stats).toEqual(['Proficiência +2', 'PV 10/10']);
    });

    it('rejeita sistema ainda não registrado', async () => {
        await expect(service.create({name: 'X', system: 'tormenta20'}, 'u1'))
            .rejects.toBeInstanceOf(BadRequestException);
    });

    it('aceita atualização parcial e mantém o restante do blob', async () => {
        const {id} = await service.create({name: 'Thorin'}, 'u1');
        const updated = await service.update(id, {class: 'Guerreiro', level: 5}, 'u1');

        expect(updated.class).toBe('Guerreiro');
        expect(updated.level).toBe(5);
        expect(updated.skills).toHaveLength(18);
        expect(updated.card.details).toEqual([{kind: 'class', text: 'Guerreiro'}]);
        expect(updated.card.stats[0]).toBe('Proficiência +3');
    });

    it('ignora troca de sistema, id e card vindos do corpo', async () => {
        const {id} = await service.create({name: 'Thorin'}, 'u1');
        const updated = await service.update(id, {
            system: 'tormenta20', id: 'outro', card: {details: [], stats: ['hack']}, userId: 'u2',
        }, 'u1');

        expect(updated.system).toBe('dnd5_5e');
        expect(updated.id).toBe(id);
        expect(updated.card.stats).not.toContain('hack');
        expect(repo.rows.get(id)!.userId).toBe('u1');
        expect(repo.rows.get(id)!.data).not.toHaveProperty('system');
    });

    it('descarta chaves desconhecidas (como o whitelist do DTO antigo)', async () => {
        const {id} = await service.create({name: 'Thorin'}, 'u1');
        await service.update(id, {initiative: 3, lixo: 'x'}, 'u1');

        expect(repo.rows.get(id)!.data).not.toHaveProperty('initiative');
        expect(repo.rows.get(id)!.data).not.toHaveProperty('lixo');
    });

    it('trata null como "não informado" e mantém o valor salvo', async () => {
        const {id} = await service.create({name: 'Thorin'}, 'u1');
        const updated = await service.update(id, {armorClass: null, name: null}, 'u1');

        expect(updated.armorClass).toBe(10);
        expect(updated.name).toBe('Thorin');
    });

    it('rejeita texto longo demais com mensagem que a UI reconhece', async () => {
        const {id} = await service.create({name: 'Thorin'}, 'u1');
        const promise = service.update(id, {feats: 'a'.repeat(5_001)}, 'u1');

        await expect(promise).rejects.toBeInstanceOf(BadRequestException);
        const message = await promise.catch(e => JSON.stringify(e.getResponse()));
        expect(message).toContain('texto');
        expect(message).toContain('limite');
    });

    it('rejeita tipo errado no primeiro nível', async () => {
        const {id} = await service.create({name: 'Thorin'}, 'u1');
        await expect(service.update(id, {skills: 'não é array'}, 'u1'))
            .rejects.toBeInstanceOf(BadRequestException);
        await expect(service.update(id, {level: 21}, 'u1'))
            .rejects.toBeInstanceOf(BadRequestException);
    });

    it('persiste isShared no envelope e ainda espelha as colunas legadas', async () => {
        const {id} = await service.create({name: 'Thorin'}, 'u1');
        await service.update(id, {isShared: true, species: 'Anão'}, 'u1');
        const row = repo.rows.get(id)!;

        expect(row.isShared).toBe(true);
        expect(row.species).toBe('Anão'); // espelho transitório
        expect(row.data).not.toHaveProperty('isShared');
    });

    it('bloqueia acesso de outro usuário', async () => {
        const {id} = await service.create({name: 'Thorin'}, 'u1');
        await expect(service.update(id, {class: 'Mago'}, 'u2')).rejects.toBeInstanceOf(ForbiddenException);
        await expect(service.findOneForUser(id, 'u2')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('listagem devolve só o envelope + card', async () => {
        await service.create({name: 'Thorin'}, 'u1');
        const [item] = await service.findAll('u1');

        expect(Object.keys(item).sort()).toEqual(
            ['card', 'createdAt', 'id', 'isShared', 'level', 'name', 'system', 'updatedAt'],
        );
    });

    it('ficha compartilhada não expõe o userId', async () => {
        const {id} = await service.create({name: 'Thorin'}, 'u1');
        await service.update(id, {isShared: true}, 'u1');
        const shared = await service.findShared(id);

        expect(shared).not.toHaveProperty('userId');
        expect(shared.name).toBe('Thorin');
    });
});
