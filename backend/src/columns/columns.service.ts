import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateColumnDto } from './dto/create-column.dto.js';
import { UpdateColumnDto } from './dto/update-column.dto.js';

@Injectable()
export class ColumnsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createColumnDto: CreateColumnDto) {
    const board = await this.prisma.board.findUnique({
      where: { id: createColumnDto.boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board com o ID "${createColumnDto.boardId}" não existe.`);
    }

    const count = await this.prisma.column.count({
      where: { boardId: createColumnDto.boardId },
    });

    return this.prisma.column.create({
      data: {
        name: createColumnDto.name,
        boardId: createColumnDto.boardId,
        color: createColumnDto.color || '#3b82f6',
        order: createColumnDto.order ?? count,
      },
    });
  }

  async update(id: string, updateColumnDto: UpdateColumnDto) {
    const column = await this.prisma.column.findUnique({ where: { id } });
    if (!column) {
      throw new NotFoundException(`Coluna "${id}" não encontrada.`);
    }

    return this.prisma.column.update({
      where: { id },
      data: updateColumnDto,
    });
  }

  async remove(id: string) {
    const column = await this.prisma.column.findUnique({ where: { id } });
    if (!column) {
      throw new NotFoundException(`Coluna "${id}" não encontrada.`);
    }

    return this.prisma.column.delete({
      where: { id },
    });
  }
}

