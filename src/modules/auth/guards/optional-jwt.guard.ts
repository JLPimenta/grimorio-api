import {ExecutionContext, Injectable} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';

// Usado em rotas que funcionam com ou sem autenticação
// Ex: GET /characters — retorna fichas do usuário se logado,
//     ou todas as fichas se não logado (fase de transição)
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any) {
        return user ?? null;
    }

    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }
}