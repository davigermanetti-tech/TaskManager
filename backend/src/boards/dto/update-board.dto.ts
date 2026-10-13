import { IsOptional, IsString, IsBoolean } from 'class-validator';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * DTO: UPDATE BOARD
 * ══════════════════════════════════════════════════════════════════════════════
 * Na atualização (PATCH /boards/:id), todos os campos são opcionais.
 * O usuário pode atualizar apenas o nome, apenas o emoji ou apenas a capa.
 */
export class UpdateBoardDto {
  @IsString({ message: 'O nome do board deve ser um texto' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'O emoji deve ser um texto' })
  @IsOptional()
  emoji?: string;

  @IsString({ message: 'A capa deve ser um texto' })
  @IsOptional()
  cover?: string;

  @IsBoolean({ message: 'coverIsImage deve ser booleano' })
  @IsOptional()
  coverIsImage?: boolean;
}

