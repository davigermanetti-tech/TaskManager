import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * PRISMA SERVICE — GERENCIADOR DE CONEXÃO COM O BANCO DE DADOS
 * ══════════════════════════════════════════════════════════════════════════════
 * Herda todos os métodos do PrismaClient (findMany, create, update, delete)
 * e gerencia o ciclo de vida da conexão com o banco de dados PostgreSQL.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Chamado automaticamente pelo NestJS quando o módulo é inicializado.
   * Abre a conexão com o banco de dados.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Chamado automaticamente pelo NestJS quando o servidor é encerrado.
   * Fecha a conexão com segurança, evitando vazamento de conexões (connection leaks).
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

