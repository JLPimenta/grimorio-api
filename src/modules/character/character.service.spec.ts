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
        await expect(service.create({name: 'X', system: 'pathfinder'}, 'u1'))
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

    it('listagem devolve o envelope + card, sem o blob', async () => {
        await service.create({name: 'Thorin'}, 'u1');
        const [item] = await service.findAll('u1');

        expect(item).not.toHaveProperty('data');
        expect(item).toMatchObject({name: 'Thorin', system: 'dnd5_5e', level: 1});
        expect(item.card.stats).toEqual(['Proficiência +2', 'PV 10/10']);
    });

    it('listagem continua compatível com o frontend anterior à Fase 1', async () => {
        // O card antigo lê character.hitPoints.current sem checagem.
        const {id} = await service.create({name: 'Thorin'}, 'u1');
        await service.update(id, {class: 'Guerreiro', species: 'Anão', hitPoints: {current: 7, max: 12, temp: 0}}, 'u1');
        await service.create({name: 'Kara', system: 'tormenta20'}, 'u1');
        const [d55, t20] = await service.findAll('u1');

        expect(d55).toMatchObject({class: 'Guerreiro', species: 'Anão', hitPoints: {current: 7, max: 12}});
        expect(t20.hitPoints).toEqual({current: 0, max: 0, temp: 0});
    });

    it('ficha compartilhada não expõe o userId', async () => {
        const {id} = await service.create({name: 'Thorin'}, 'u1');
        await service.update(id, {isShared: true}, 'u1');
        const shared = await service.findShared(id);

        expect(shared).not.toHaveProperty('userId');
        expect(shared.name).toBe('Thorin');
    });
});

describe('CharacterService — Tormenta20', () => {
    let repo: InMemoryRepo;
    let service: CharacterService;

    beforeEach(() => {
        repo = new InMemoryRepo();
        service = new CharacterService(repo as unknown as CharacterRepository);
    });

    it('cria ficha T20 com defaults próprios e sem colunas legadas', async () => {
        const sheet = await service.create({name: 'Kara', system: 'tormenta20'}, 'u1');
        const row = repo.rows.get(sheet.id)!;

        expect(row.system).toBe('tormenta20');
        expect(Object.keys((row.data as any).skills)).toHaveLength(30);
        expect(row.data).toHaveProperty('mp');
        expect(row.data).not.toHaveProperty('abilities');
        expect(row.class).toBeUndefined(); // espelho legado é só do 5.5e
        expect(sheet.card.stats).toEqual(['PV 0/0', 'PM 0/0']);
    });

    it('valida e salva atualização, derivando o card', async () => {
        const {id} = await service.create({name: 'Kara', system: 'tormenta20'}, 'u1');
        const updated = await service.update(id, {
            class: 'Clérigo', race: 'Anão', origin: 'Acólito', level: 5,
            hp: {max: 20, current: 15, temp: 0}, mp: {max: 6, current: 3, temp: 0},
            attributes: {for: 1, des: 0, con: 2, int: 0, sab: 4, car: 1},
            spells: [{
                id: 's1', circle: 1, name: 'Curar Ferimentos', school: 'Evocação', execution: 'Padrão',
                range: 'Toque', target: '1 criatura', duration: 'Instantânea', resistance: '', description: '2d8+2 PV',
            }],
        }, 'u1');

        expect(updated.level).toBe(5);
        expect(updated.card).toEqual({
            details: [{kind: 'class', text: 'Clérigo'}, {kind: 'origin', text: 'Anão · Acólito'}],
            stats: ['PV 15/20', 'PM 3/6'],
        });
        expect((updated.spells as unknown[])).toHaveLength(1);
    });

    it('rejeita conteúdo inválido no formato T20', async () => {
        const {id} = await service.create({name: 'Kara', system: 'tormenta20'}, 'u1');

        await expect(service.update(id, {attributes: {for: 'alto'}}, 'u1')).rejects.toBeInstanceOf(BadRequestException);
        await expect(service.update(id, {size: 'gigante'}, 'u1')).rejects.toBeInstanceOf(BadRequestException);
        await expect(service.update(id, {skills: {voar: {trained: true, attribute: 'des', other: 0}}}, 'u1'))
            .rejects.toBeInstanceOf(BadRequestException);
        await expect(service.update(id, {spells: [{id: 'x', circle: 6, name: 'Desejo'}]}, 'u1'))
            .rejects.toBeInstanceOf(BadRequestException);
    });

    it('descarta campos de D&D enviados para uma ficha T20', async () => {
        const {id} = await service.create({name: 'Kara', system: 'tormenta20'}, 'u1');
        await service.update(id, {armorClass: 18, spellSlots: {}}, 'u1');

        expect(repo.rows.get(id)!.data).not.toHaveProperty('armorClass');
        expect(repo.rows.get(id)!.data).not.toHaveProperty('spellSlots');
    });
});

describe('CharacterService — D&D 5e (2014)', () => {
    let repo: InMemoryRepo;
    let service: CharacterService;

    beforeEach(() => {
        repo = new InMemoryRepo();
        service = new CharacterService(repo as unknown as CharacterRepository);
    });

    it('cria ficha 5e própria, sem campos do 5.5e nem colunas legadas', async () => {
        const sheet = await service.create({name: 'Bruenor', system: 'dnd5e'}, 'u1');
        const row = repo.rows.get(sheet.id)!;
        const data = row.data as Record<string, any>;

        expect(row.system).toBe('dnd5e');
        expect(data.skills.map((s: any) => s.name)).toContain('Blefar');
        for (const key of ['species', 'subclass', 'feats', 'classFeatures']) expect(data).not.toHaveProperty(key);
        expect(row.class).toBeUndefined(); // espelho legado é só do 5.5e
    });

    it('salva campos próprios e deriva o card com a raça', async () => {
        const {id} = await service.create({name: 'Bruenor', system: 'dnd5e'}, 'u1');
        const updated = await service.update(id, {
            class: 'Guerreiro', race: 'Anão', level: 5, ideals: 'Honra',
            features: [{id: 'f1', name: 'Retomar o Fôlego', description: '1d10 + nível'}],
            hitPoints: {current: 31, max: 44, temp: 0},
        }, 'u1');

        expect(updated.ideals).toBe('Honra');
        expect(updated.card).toEqual({
            details: [{kind: 'class', text: 'Guerreiro'}, {kind: 'origin', text: 'Anão'}],
            stats: ['Proficiência +3', 'PV 31/44'],
        });
    });

    it('valida os campos próprios do 5e', async () => {
        const {id} = await service.create({name: 'Bruenor', system: 'dnd5e'}, 'u1');
        await expect(service.update(id, {features: [{id: 'f1', name: 1}]}, 'u1')).rejects.toBeInstanceOf(BadRequestException);
        await expect(service.update(id, {characteristics: {age: 'x'.repeat(51)}}, 'u1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('descarta campos do 5.5e enviados para uma ficha 5e', async () => {
        const {id} = await service.create({name: 'Bruenor', system: 'dnd5e'}, 'u1');
        await service.update(id, {species: 'Elfo', weaponTraining: 'Marciais'}, 'u1');
        expect(repo.rows.get(id)!.data).not.toHaveProperty('species');
        expect(repo.rows.get(id)!.data).not.toHaveProperty('weaponTraining');
    });
});
