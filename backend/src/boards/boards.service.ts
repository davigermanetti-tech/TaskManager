import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBoardDto } from './dto/create-board.dto.js';
import { UpdateBoardDto } from './dto/update-board.dto.js';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * BOARDS SERVICE — REGRAS DE NEGÓCIO DOS QUADROS E MEMBROS
 * ══════════════════════════════════════════════════════════════════════════════
 * Garante controle de acesso estrito:
 * - Cada usuário visualiza e acessa SOMENTE os quadros onde é Dono ou Membro.
 * - Membros são vinculados diretamente aos usuários cadastrados no PostgreSQL.
 */
@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista apenas os quadros aos quais o usuário logado pertence
   * (seja como Dono/Criador ou como Membro convidado).
   * Inclui os membros, dono, colunas e tarefas completas.
   */
  async findAll(userId: string) {
    const boards = await this.prisma.board.findMany({
      where: {
        OR: [
          { userId },
          { members: { some: { userId } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: {
                tags: true,
                checklist: { orderBy: { order: 'asc' } },
                comments: { orderBy: { createdAt: 'asc' } },
              },
            },
          },
        },
      },
    });

    // Auto-cura: se algum quadro legado não tiver o dono registrado em BoardMember, registra automaticamente
    for (const board of boards) {
      const hasOwnerMember = board.members.some((m) => m.userId === board.userId);
      if (!hasOwnerMember) {
        try {
          const ownerMember = await this.prisma.boardMember.create({
            data: {
              boardId: board.id,
              userId: board.userId,
              role: 'owner',
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          });
          board.members.unshift(ownerMember);
        } catch (_) {}
      }
    }

    return boards;
  }

  /**
   * Busca um quadro específico pelo ID.
   * Valida permissão: lança ForbiddenException se o usuário não for Dono nem Membro.
   */
  async findOne(id: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: {
                tags: true,
                checklist: { orderBy: { order: 'asc' } },
                comments: { orderBy: { createdAt: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException(`Board com o ID "${id}" não foi encontrado.`);
    }

    const hasAccess =
      board.userId === userId ||
      board.members.some((m) => m.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException(
        'Você não possui permissão para acessar este quadro.',
      );
    }

    // Auto-cura do dono em BoardMember se ainda não existir
    const hasOwnerMember = board.members.some((m) => m.userId === board.userId);
    if (!hasOwnerMember) {
      try {
        const ownerMember = await this.prisma.boardMember.create({
          data: {
            boardId: board.id,
            userId: board.userId,
            role: 'owner',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        });
        board.members.unshift(ownerMember);
      } catch (_) {}
    }

    return board;
  }

  /**
   * Verificação leve e ultrarrápida de permissão de acesso ao quadro.
   * Evita carregar tarefas, colunas e comentários desnecessariamente na memória.
   */
  private async checkBoardAccess(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: {
        id: true,
        userId: true,
        members: {
          where: { userId },
          select: { id: true, role: true },
        },
      },
    });

    if (!board) {
      throw new NotFoundException(`Board com o ID "${boardId}" não foi encontrado.`);
    }

    const isOwner = board.userId === userId;
    const isMember = board.members.length > 0;

    if (!isOwner && !isMember) {
      throw new ForbiddenException('Você não possui permissão para acessar este quadro.');
    }

    return { board, isOwner, isMember };
  }

  /**
   * Cria um novo quadro associado ao usuário logado (dono).
   * Utiliza criação aninhada atômica do Prisma (1 única query no banco),
   * eliminando queries sequenciais e latência de rede.
   */
  async create(userId: string, createBoardDto: CreateBoardDto) {
    const uniqueMemberIds = Array.from(
      new Set(createBoardDto.memberIds || []),
    ).filter((mId) => mId !== userId && mId.trim() !== '');

    const membersToCreate = [
      { userId, role: 'owner' },
      ...uniqueMemberIds.map((mId) => ({ userId: mId, role: 'member' })),
    ];

    return this.prisma.board.create({
      data: {
        name: createBoardDto.name,
        emoji: createBoardDto.emoji || '📋',
        cover: createBoardDto.cover || 'linear-gradient(135deg,#0f0c29,#302b63)',
        coverIsImage: createBoardDto.coverIsImage || false,
        userId,
        columns: {
          create: [
            { name: 'A Fazer', color: '#64748b', order: 0 },
            { name: 'Em Andamento', color: '#3b82f6', order: 1 },
            { name: 'Concluído', color: '#22c55e', order: 2 },
          ],
        },
        members: {
          create: membersToCreate,
        },
      },
      include: {
        columns: { orderBy: { order: 'asc' } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Atualiza parcialmente um quadro (nome, emoji ou capa).
   */
  async update(id: string, userId: string, updateBoardDto: UpdateBoardDto) {
    await this.checkBoardAccess(id, userId);

    return this.prisma.board.update({
      where: { id },
      data: updateBoardDto,
      include: {
        columns: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Remove um quadro.
   * Apenas o criador/proprietário tem permissão para excluir o quadro.
   */
  async remove(id: string, userId: string) {
    const { isOwner } = await this.checkBoardAccess(id, userId);

    if (!isOwner) {
      throw new ForbiddenException(
        'Apenas o proprietário deste quadro tem permissão para excluí-lo.',
      );
    }

    return this.prisma.board.delete({
      where: { id },
    });
  }

  /**
   * Retorna a lista de membros de um quadro de forma rápida e direta.
   */
  async getMembers(boardId: string, userId: string) {
    await this.checkBoardAccess(boardId, userId);

    return this.prisma.boardMember.findMany({
      where: { boardId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Adiciona um usuário cadastrado como membro do quadro de forma otimizada.
   */
  async addMember(
    boardId: string,
    currentUserId: string,
    targetUserId: string,
    role = 'member',
  ) {
    const { isOwner } = await this.checkBoardAccess(boardId, currentUserId);

    if (!isOwner) {
      throw new ForbiddenException(
        'Apenas o proprietário do quadro tem permissão para adicionar participantes.',
      );
    }

    try {
      return await this.prisma.boardMember.create({
        data: {
          boardId,
          userId: targetUserId,
          role,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new ConflictException('Este usuário já é participante deste quadro.');
      }
      if (err.code === 'P2003') {
        throw new NotFoundException('Usuário não encontrado no sistema.');
      }
      throw err;
    }
  }

  /**
   * Remove um membro do quadro de forma direta e atômica.
   */
  async removeMember(
    boardId: string,
    currentUserId: string,
    targetUserId: string,
  ) {
    const { board, isOwner } = await this.checkBoardAccess(boardId, currentUserId);

    if (targetUserId === board.userId) {
      throw new ForbiddenException('O proprietário do quadro não pode ser removido.');
    }

    if (!isOwner && currentUserId !== targetUserId) {
      throw new ForbiddenException(
        'Você não tem permissão para remover outros participantes deste quadro.',
      );
    }

    try {
      await this.prisma.boardMember.delete({
        where: {
          boardId_userId: {
            boardId,
            userId: targetUserId,
          },
        },
      });
      return { message: 'Participante removido com sucesso.' };
    } catch (err: any) {
      if (err.code === 'P2025') {
        throw new NotFoundException('Participante não encontrado no quadro.');
      }
      throw err;
    }
  }
}

