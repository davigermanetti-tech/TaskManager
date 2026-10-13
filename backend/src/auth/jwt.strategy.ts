import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * JWT STRATEGY — VALIDAÇÃO DO TOKEN EM CADA REQUISIÇÃO
 * ══════════════════════════════════════════════════════════════════════════════
 * O Passport executa esta classe automaticamente em qualquer rota protegida:
 * 1. Extrai o token do cabeçalho "Authorization: Bearer <TOKEN>".
 * 2. Valida a assinatura digital usando a chave secreta (JWT_SECRET).
 * 3. Se o token for válido e não tiver expirado, chama o método validate()
 *    e injeta o retorno no objeto da requisição (req.user).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET ||
        'sua_chave_secreta_super_segura_aqui_para_desenvolvimento_123',
    });
  }

  /**
   * O payload decodificado do JWT é recebido aqui.
   * O que retornarmos aqui estará disponível em @CurrentUser() ou req.user!
   */
  async validate(payload: { sub: string; email: string; name: string }) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  }
}

