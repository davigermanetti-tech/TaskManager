import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateColumnDto {
  @IsString({ message: 'O nome da coluna deve ser um texto' })
  @IsNotEmpty({ message: 'O nome da coluna é obrigatório' })
  name: string;

  @IsString({ message: 'O ID do board deve ser uma string' })
  @IsNotEmpty({ message: 'O boardId é obrigatório' })
  boardId: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsInt()
  @IsOptional()
  order?: number;
}

