import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BoardsService } from './boards.service.js';
import { CreateBoardDto } from './dto/create-board.dto.js';
import { UpdateBoardDto } from './dto/update-board.dto.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * BOARDS CONTROLLER — RECEPTOR DAS REQUISIÇÕES HTTP (/boards)
 * ══════════════════════════════════════════════════════════════════════════════
 * Protegido com JwtAuthGuard:
 * Todas as operações exigem autenticação do usuário, garantindo que cada
 * usuário veja e gerencie apenas seus próprios quadros e aqueles onde é membro.
 */
@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  /**
   * POST /boards
   * Cria um novo quadro associado ao usuário autenticado. Retorna Status 201.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() createBoardDto: CreateBoardDto,
  ) {
    return this.boardsService.create(userId, createBoardDto);
  }

  /**
   * GET /boards
   * Lista apenas os quadros aos quais o usuário logado tem acesso.
   */
  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.boardsService.findAll(userId);
  }

  /**
   * GET /boards/:id
   * Busca um quadro específico pelo ID.
   */
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.boardsService.findOne(id, userId);
  }

  /**
   * PATCH /boards/:id
   * Atualiza parcialmente dados de um quadro.
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ) {
    return this.boardsService.update(id, userId, updateBoardDto);
  }

  /**
   * DELETE /boards/:id
   * Remove um quadro (permitido apenas para o proprietário).
   */
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.boardsService.remove(id, userId);
  }

  /**
   * GET /boards/:id/members
   * Retorna os membros de um quadro específico.
   */
  @Get(':id/members')
  getMembers(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.boardsService.getMembers(id, userId);
  }

  /**
   * POST /boards/:id/members
   * Adiciona um usuário cadastrado como membro do quadro.
   */
  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  addMember(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.boardsService.addMember(id, userId, dto.userId, dto.role);
  }

  /**
   * DELETE /boards/:id/members/:userId
   * Remove um participante do quadro.
   */
  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.boardsService.removeMember(id, currentUserId, targetUserId);
  }
}
