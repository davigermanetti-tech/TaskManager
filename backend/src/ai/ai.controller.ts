import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service.js';
import {
  SubtaskBreakdownDto,
  ParseTaskPromptDto,
  DailyDigestDto,
  GenerateDescriptionDto,
} from './dto/ai.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * AI CONTROLLER — ENDPOINTS DE INTELIGÊNCIA ARTIFICIAL (/ai)
 * ══════════════════════════════════════════════════════════════════════════════
 * Protegido com JwtAuthGuard: apenas usuários autenticados podem consumir
 * os recursos de IA, protegendo a cota da sua chave de API!
 */
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * POST /ai/breakdown
   * Quebra uma tarefa em subtarefas acionáveis para a checklist.
   */
  @Post('breakdown')
  generateSubtasks(@Body() dto: SubtaskBreakdownDto) {
    return this.aiService.generateSubtasks(dto);
  }

  /**
   * POST /ai/description
   * Gera uma descrição profissional e estruturada com base no título da tarefa.
   */
  @Post('description')
  generateDescription(@Body() dto: GenerateDescriptionDto) {
    return this.aiService.generateDescription(dto);
  }

  /**
   * POST /ai/parse-task
   * Extrai título, prazos e prioridade a partir de linguagem natural.
   */
  @Post('parse-task')
  parseTask(@Body() dto: ParseTaskPromptDto) {
    return this.aiService.parseTaskFromPrompt(dto);
  }

  /**
   * POST /ai/daily-digest
   * Gera um resumo executivo com análise do status das tarefas do board.
   */
  @Post('daily-digest')
  generateDailyDigest(@Body() dto: DailyDigestDto) {
    return this.aiService.generateDailyDigest(dto);
  }
}

