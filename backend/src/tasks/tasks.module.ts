import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { TasksController } from './tasks.controller.js';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * TASKS MODULE
 * ══════════════════════════════════════════════════════════════════════════════
 * Encapsula o controlador e serviço de tarefas.
 */
@Module({
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

