import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * USERS SERVICE — GESTÃO E CONSULTA DE USUÁRIOS
 * ══════════════════════════════════════════════════════════════════════════════
 * Responsável pela listagem e busca de usuários registrados para adição a quadros.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista usuários cadastrados, opcionalmente filtrando por nome ou e-mail.
   * Por segurança, nunca expõe hashes de senha!
   */
  async findAll(search?: string) {
    const trimmed = search?.trim();

    return this.prisma.user.findMany({
      where: trimmed
        ? {
            OR: [
              { name: { contains: trimmed, mode: 'insensitive' } },
              { email: { contains: trimmed, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
      take: 50,
    });
  }
}

