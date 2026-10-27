import {BadRequestException} from '@nestjs/common';
import {BackendSystemDefinition, SystemId} from './system.types';
import {dnd55Backend} from './dnd5_5e.system';
import {tormenta20Backend} from './tormenta20.system';
import {dnd5eBackend} from './dnd5e.system';

/**
 * Único ponto do backend que conhece todos os sistemas.
 * Adicionar uma ficha nova = criar `systems/<id>.system.ts` e registrar aqui.
 */
const REGISTRY: Partial<Record<SystemId, BackendSystemDefinition>> = {
    dnd5_5e: dnd55Backend,
    tormenta20: tormenta20Backend,
    dnd5e: dnd5eBackend,
};

export function registeredSystemIds(): SystemId[] {
    return Object.keys(REGISTRY) as SystemId[];
}

export function resolveBackendSystem(id: string): BackendSystemDefinition {
    const def = REGISTRY[id as SystemId];
    if (!def) {
        throw new BadRequestException(`Sistema de jogo desconhecido: "${id}".`);
    }
    return def;
}
