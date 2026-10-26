import {z} from 'zod';

/*
 * O PUT /characters/:id recebe a ficha achatada (envelope + conteúdo do
 * sistema). O conteúdo é validado pelo `dataSchema` do sistema da ficha
 * (systems/<id>.system.ts); aqui ficam só as regras do envelope, que valem
 * para qualquer sistema.
 *
 * `system`, `card`, `schemaVersion`, `id`, `userId` e datas são controlados
 * pelo servidor e ignorados se vierem no corpo.
 */
export const envelopeUpdateSchema = z.object({
    name: z.string().trim().min(1, {message: 'O nome do personagem é obrigatório.'})
        .max(255, {message: 'O campo de texto "Nome" excede o limite de 255 caracteres.'})
        .nullish(),
    level: z.number().int().min(1).max(20).nullish(),
    isShared: z.boolean().nullish(),
});

export type EnvelopeUpdate = z.infer<typeof envelopeUpdateSchema>;
