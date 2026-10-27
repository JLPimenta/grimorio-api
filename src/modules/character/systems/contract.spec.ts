import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {extractData} from '../character.mapper';
import {resolveBackendSystem} from './registry';

/*
 * Contrato frontend ↔ backend, por sistema.
 *
 * As fixtures em __fixtures__/ são fichas geradas pelo PRÓPRIO frontend
 * (createDefault do sistema + alguns campos preenchidos), no formato wire.
 * Se um lado ganhar, perder ou renomear um campo sem o outro, este teste
 * quebra. Ao criar ou mudar um sistema, regenere a fixture dele
 * (passo a passo na skill de novos sistemas).
 */

/** Campos que o frontend envia mas que, de propósito, não são persistidos. */
const STRIPPED_ON_PURPOSE: Record<string, string[]> = {
    // `initiative` é calculado na tela; o bônus manual fica em bonuses.initiative
    dnd5_5e: ['initiative'],
};

const dir = join(__dirname, '__fixtures__');
const fixtures = readdirSync(dir)
    .filter(f => f.endsWith('.frontend.json'))
    .map(f => [f, JSON.parse(readFileSync(join(dir, f), 'utf8'))] as const);

describe('contrato frontend ↔ backend', () => {
    it('existe uma fixture para cada sistema registrado', () => {
        const systems = fixtures.map(([, wire]) => wire.system).sort();
        expect(systems).toEqual(['dnd5_5e', 'dnd5e', 'tormenta20']);
    });

    describe.each(fixtures)('%s', (_file, wire) => {
        const system = resolveBackendSystem(wire.system);
        const stripped = STRIPPED_ON_PURPOSE[system.id] ?? [];
        const sent = extractData(wire);
        const expected = Object.fromEntries(Object.entries(sent).filter(([k]) => !stripped.includes(k)));

        it('a ficha enviada pelo frontend passa no schema sem perder campos', () => {
            const parsed = system.dataSchema.safeParse(sent);
            if (!parsed.success) throw new Error(JSON.stringify(parsed.error.issues, null, 2));
            expect(parsed.data).toEqual(expected);
        });

        it('backend e frontend têm os mesmos campos default', () => {
            expect(Object.keys(system.buildDefaultData()).sort()).toEqual(Object.keys(expected).sort());
        });

        it('backend e frontend têm o mesmo catálogo de perícias', () => {
            const skillIds = (skills: unknown) => Array.isArray(skills)
                ? skills.map(s => (s as { name: string }).name)
                : Object.keys(skills as object);
            expect(skillIds(system.buildDefaultData().skills)).toEqual(skillIds(expected.skills));
        });
    });
});
