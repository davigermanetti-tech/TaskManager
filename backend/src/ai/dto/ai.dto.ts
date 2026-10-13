import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO para pedir à IA que quebre uma tarefa em subtarefas acionáveis
 */
export class SubtaskBreakdownDto {
  @IsString({ message: 'O título da tarefa deve ser um texto' })
  @IsNotEmpty({ message: 'O título da tarefa é obrigatório' })
  title: string;

  @IsString({ message: 'A descrição deve ser um texto' })
  @IsOptional()
  description?: string;
}

/**
 * DTO para criar tarefa a partir de texto livre em linguagem natural
 */
export class ParseTaskPromptDto {
  @IsString({ message: 'O texto do prompt deve ser uma string' })
  @IsNotEmpty({ message: 'O texto da tarefa em linguagem natural é obrigatório' })
  prompt: string;
}

/**
 * DTO para solicitar o resumo executivo de um board
 */
export class DailyDigestDto {
  @IsString({ message: 'O ID do board deve ser uma string' })
  @IsNotEmpty({ message: 'O boardId é obrigatório' })
  boardId: string;
}

/**
 * DTO para solicitar à IA a geração de uma descrição profissional da tarefa
 */
export class GenerateDescriptionDto {
  @IsString({ message: 'O título da tarefa deve ser um texto' })
  @IsNotEmpty({ message: 'O título da tarefa é obrigatório' })
  title: string;

  @IsString({ message: 'A descrição atual deve ser um texto' })
  @IsOptional()
  currentDescription?: string;
}

