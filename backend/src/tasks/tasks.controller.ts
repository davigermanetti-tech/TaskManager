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
} from '@nestjs/common';
import { TasksService } from './tasks.service.js';
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
 * TASKS CONTROLLER — ENDPOINTS REST DE TAREFAS (/tasks)
 * ══════════════════════════════════════════════════════════════════════════════
 */
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * POST /tasks
   * Cria uma nova tarefa na coluna informada.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  /**
   * GET /tasks/:id
   * Retorna os detalhes de uma tarefa (tags, checklist, comentários).
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  /**
   * PATCH /tasks/:id
   * Atualiza dados da tarefa ou a move para outra coluna (drag-and-drop).
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, updateTaskDto);
  }

  /**
   * DELETE /tasks/:id
   * Remove uma tarefa.
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  /* ── Endpoints de Checklist ── */
  @Post(':id/checklist')
  addChecklistItem(
    @Param('id') taskId: string,
    @Body() dto: CreateChecklistItemDto,
  ) {
    return this.tasksService.addChecklistItem(taskId, dto);
  }

  @Patch('checklist/:itemId')
  updateChecklistItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
  ) {
    return this.tasksService.updateChecklistItem(itemId, dto);
  }

  @Delete('checklist/:itemId')
  removeChecklistItem(@Param('itemId') itemId: string) {
    return this.tasksService.removeChecklistItem(itemId);
  }

  /* ── Endpoints de Tags ── */
  @Post(':id/tags')
  addTag(
    @Param('id') taskId: string,
    @Body() dto: CreateTagDto,
  ) {
    return this.tasksService.addTag(taskId, dto);
  }

  @Delete('tags/:tagId')
  removeTag(@Param('tagId') tagId: string) {
    return this.tasksService.removeTag(tagId);
  }

  /* ── Endpoints de Comentários ── */
  @Post(':id/comments')
  addComment(
    @Param('id') taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.tasksService.addComment(taskId, dto);
  }
}

