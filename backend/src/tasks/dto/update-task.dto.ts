import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * DTO: UPDATE TASK
 * ══════════════════════════════════════════════════════════════════════════════
 * Permite atualização parcial (PATCH /tasks/:id) de qualquer atributo da tarefa.
 */
export class UpdateTaskDto {
  @IsString({ message: 'O título deve ser um texto' })
  @IsOptional()
  title?: string;

  @IsString({ message: 'A coluna de destino deve ser uma string' })
  @IsOptional()
  columnId?: string;

  @IsString({ message: 'A descrição deve ser um texto' })
  @IsOptional()
  description?: string;

  @IsString({ message: 'O status deve ser um texto' })
  @IsIn(['todo', 'doing', 'done'], {
    message: 'O status deve ser: todo, doing ou done',
  })
  @IsOptional()
  status?: string;

  @IsString({ message: 'A prioridade deve ser um texto' })
  @IsIn(['baixa', 'media', 'alta'], {
    message: 'A prioridade deve ser: baixa, media ou alta',
  })
  @IsOptional()
  priority?: string;

  @IsString({ message: 'O responsável deve ser uma string' })
  @IsOptional()
  assignedTo?: string;

  @IsString({ message: 'O prazo deve ser no formato YYYY-MM-DD' })
  @IsOptional()
  deadline?: string;

  @IsString({ message: 'O horário do prazo deve ser no formato HH:mm' })
  @IsOptional()
  deadlineTime?: string;

  @IsInt({ message: 'O progresso deve ser um número inteiro' })
  @Min(0, { message: 'O progresso mínimo é 0%' })
  @Max(100, { message: 'O progresso máximo é 100%' })
  @IsOptional()
  progress?: number;

  @IsString({ message: 'A cor deve ser uma string hexadecimal' })
  @IsOptional()
  color?: string;

  @IsInt({ message: 'A ordem deve ser um número inteiro' })
  @IsOptional()
  order?: number;
}

