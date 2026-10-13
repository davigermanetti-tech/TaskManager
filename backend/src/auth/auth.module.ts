import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './jwt.strategy.js';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * AUTH MODULE — MÓDULO DE AUTENTICAÇÃO E SEGURANÇA
 * ══════════════════════════════════════════════════════════════════════════════
 * O decorator @Global() permite que o JwtAuthGuard e PassportModule sejam
 * utilizados em qualquer controller do sistema (como AiController) sem necessidade
 * de reimportar AuthModule em cada módulo.
 */
@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        'sua_chave_secreta_super_segura_aqui_para_desenvolvimento_123',
      signOptions: { expiresIn: '7d' }, // O token expira automaticamente após 7 dias
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}

