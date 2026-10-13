import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * JWT AUTH GUARD — GUARDIÃO DE ROTAS PROTEGIDAS
 * ══════════════════════════════════════════════════════════════════════════════
 * Bloqueia o acesso a qualquer rota decorada com @UseGuards(JwtAuthGuard)
 * caso o cliente não envie um token JWT válido no cabeçalho Authorization.
 * Retorna automaticamente HTTP 401 Unauthorized em caso de falha.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

