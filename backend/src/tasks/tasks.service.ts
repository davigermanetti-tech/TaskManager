import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import {
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  CreateTagDto,
  CreateCommentDto,
} from './dto/sub-resources.dto.js';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * TASKS SERVICE — REGRAS DE NEGÓCIO DAS TAREFAS
 * ══════════════════════════════════════════════════════════════════════════════
 * Gerencia todo o ciclo de vida das tarefas: criação, ordenação,
 * movimentação entre colunas (drag-and-drop), checklists, tags e comentários.
 */
@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova tarefa vinculada a uma coluna.
   * Calcula automaticamente a ordem do card no final da coluna.
   */
  async create(createTaskDto: CreateTaskDto) {
    // 1. Verifica se a coluna de destino existe
    const column = await this.prisma.column.findUnique({
      where: { id: createTaskDto.columnId },
    });

    if (!column) {
      throw new NotFoundException(
        `Coluna com o ID "${createTaskDto.columnId}" não foi encontrada.`,
      );
    }

    // 2. Calcula a ordem automática (se não informada)
    const taskCount = await this.prisma.task.count({
      where: { columnId: createTaskDto.columnId },
    });
    const order = createTaskDto.order ?? taskCount;

    // 3. Cria a tarefa no banco
    return this.prisma.task.create({
      data: {
        title: createTaskDto.title,
        columnId: createTaskDto.columnId,
        description: createTaskDto.description || null,
        status: createTaskDto.status || 'todo',
        priority: createTaskDto.priority || 'media',
        assignedTo: createTaskDto.assignedTo || null,
        deadline: createTaskDto.deadline || null,
        deadlineTime: createTaskDto.deadlineTime || null,
        progress: createTaskDto.progress ?? 0,
        color: createTaskDto.color || null,
        order,
      },
      include: {
        tags: true,
        checklist: true,
        comments: true,
      },
    });
  }

  /**
   * Busca uma tarefa específica com todas as suas subtarefas, tags e comentários.
   */
  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        tags: true,
        checklist: { orderBy: { order: 'asc' } },
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!task) {
      throw new NotFoundException(`Tarefa com o ID "${id}" não foi encontrada.`);
    }

    return task;
  }

  /**
   * Atualiza qualquer campo de uma tarefa (incluindo mudança de coluna / drag-and-drop).
   */
  async update(id: string, updateTaskDto: UpdateTaskDto) {
    await this.findOne(id);

    // Se estiver movendo para outra coluna, valida se ela existe
    if (updateTaskDto.columnId) {
      const column = await this.prisma.column.findUnique({
        where: { id: updateTaskDto.columnId },
      });
      if (!column) {
        throw new NotFoundException(
          `Coluna de destino com o ID "${updateTaskDto.columnId}" não existe.`,
        );
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
      include: {
        tags: true,
        checklist: true,
        comments: true,
      },
    });
  }

  /**
   * Remove uma tarefa (em cascata, remove seus itens de checklist, tags e comentários).
   */
  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.task.delete({
      where: { id },
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     SUB-RECURSOS: CHECKLIST
     ══════════════════════════════════════════════════════════════════════════════ */
  async addChecklistItem(taskId: string, dto: CreateChecklistItemDto) {
    await this.findOne(taskId);

    const count = await this.prisma.checklistItem.count({
      where: { taskId },
    });

    return this.prisma.checklistItem.create({
      data: {
        taskId,
        text: dto.text,
        order: count,
      },
    });
  }

  async updateChecklistItem(itemId: string, dto: UpdateChecklistItemDto) {
    const item = await this.prisma.checklistItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException(`Item de checklist "${itemId}" não encontrado.`);
    }

    return this.prisma.checklistItem.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async removeChecklistItem(itemId: string) {
    const item = await this.prisma.checklistItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException(`Item de checklist "${itemId}" não encontrado.`);
    }

    return this.prisma.checklistItem.delete({
      where: { id: itemId },
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     SUB-RECURSOS: TAGS
     ══════════════════════════════════════════════════════════════════════════════ */
  async addTag(taskId: string, dto: CreateTagDto) {
    await this.findOne(taskId);

    return this.prisma.tag.create({
      data: {
        taskId,
        text: dto.text,
        color: dto.color || '#3b82f6',
      },
    });
  }

  async removeTag(tagId: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      throw new NotFoundException(`Tag "${tagId}" não encontrada.`);
    }

    return this.prisma.tag.delete({
      where: { id: tagId },
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     SUB-RECURSOS: COMENTÁRIOS
     ══════════════════════════════════════════════════════════════════════════════ */
  async addComment(taskId: string, dto: CreateCommentDto) {
    await this.findOne(taskId);

    // Recupera o usuário padrão para autor do comentário
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new NotFoundException('Nenhum usuário encontrado para autor do comentário.');
    }

    return this.prisma.comment.create({
      data: {
        taskId,
        userId: user.id,
        text: dto.text,
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }
}

