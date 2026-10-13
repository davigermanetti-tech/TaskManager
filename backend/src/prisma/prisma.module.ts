import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * PRISMA MODULE — MÓDULO GLOBAL DE BANCO DE DADOS
 * ══════════════════════════════════════════════════════════════════════════════
 * O decorator @Global() torna o PrismaService acessível em qualquer outro
 * módulo (Boards, Tasks, Auth, AI) sem que precisemos reimportá-lo manualmente.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Exporta o PrismaService para que outros módulos possam usá-lo
})
export class PrismaModule {}

