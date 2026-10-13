import { Module } from '@nestjs/common';
import { BoardsService } from './boards.service.js';
import { BoardsController } from './boards.controller.js';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * BOARDS MODULE
 * ══════════════════════════════════════════════════════════════════════════════
 * Agrupa o BoardsController e o BoardsService em uma unidade coesa.
 */
@Module({
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}

