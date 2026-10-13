import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * DTO: CREATE TASK
 * ══════════════════════════════════════════════════════════════════════════════
 * Define e valida os dados para criar uma nova tarefa dentro de uma coluna.
 */
export class CreateTaskDto {
  @IsString({ message: 'O título deve ser um texto' })
  @IsNotEmpty({ message: 'O título da tarefa é obrigatório' })
  title: string;

  @IsString({ message: 'O ID da coluna deve ser uma string' })
  @IsNotEmpty({ message: 'O ID da coluna (columnId) é obrigatório' })
  columnId: string;

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

  @IsString({ message: 'O prazo deve ser uma string no formato YYYY-MM-DD' })
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

