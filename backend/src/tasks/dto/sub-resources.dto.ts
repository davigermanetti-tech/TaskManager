import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO para adicionar item à checklist de uma tarefa
 */
export class CreateChecklistItemDto {
  @IsString({ message: 'O texto do item deve ser uma string' })
  @IsNotEmpty({ message: 'O texto do item da checklist é obrigatório' })
  text: string;
}

/**
 * DTO para atualizar item da checklist (marcar como concluído / alterar texto)
 */
export class UpdateChecklistItemDto {
  @IsBoolean({ message: 'done deve ser booleano' })
  @IsOptional()
  done?: boolean;

  @IsString({ message: 'O texto deve ser uma string' })
  @IsOptional()
  text?: string;
}

/**
 * DTO para adicionar tag a uma tarefa
 */
export class CreateTagDto {
  @IsString({ message: 'O texto da tag deve ser uma string' })
  @IsNotEmpty({ message: 'O nome da tag é obrigatório' })
  text: string;

  @IsString({ message: 'A cor da tag deve ser uma string' })
  @IsOptional()
  color?: string;
}

/**
 * DTO para adicionar comentário a uma tarefa
 */
export class CreateCommentDto {
  @IsString({ message: 'O texto do comentário deve ser uma string' })
  @IsNotEmpty({ message: 'O texto do comentário é obrigatório' })
  text: string;
}

