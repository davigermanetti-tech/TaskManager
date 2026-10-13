import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * DTO: CREATE BOARD (Data Transfer Object)
 * ══════════════════════════════════════════════════════════════════════════════
 * Define o formato esperado no corpo (JSON) da requisição POST /boards.
 * Os decorators do class-validator validam os dados automaticamente antes de
 * chegarem ao Controller ou ao Service.
 */
export class CreateBoardDto {
  @IsString({ message: 'O nome do board deve ser um texto' })
  @IsNotEmpty({ message: 'O nome do board é obrigatório' })
  name: string;

  @IsString({ message: 'O emoji deve ser um texto' })
  @IsOptional()
  emoji?: string;

  @IsString({ message: 'A capa deve ser um texto (cor, gradiente ou URL)' })
  @IsOptional()
  cover?: string;

  @IsBoolean({ message: 'coverIsImage deve ser um valor booleano (true ou false)' })
  @IsOptional()
  coverIsImage?: boolean;

  @IsArray({ message: 'memberIds deve ser uma lista de IDs de usuários' })
  @IsString({ each: true, message: 'Cada ID de membro deve ser um texto' })
  @IsOptional()
  memberIds?: string[];
}

