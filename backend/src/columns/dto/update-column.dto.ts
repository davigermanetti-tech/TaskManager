import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateColumnDto {
  @IsString({ message: 'O nome da coluna deve ser um texto' })
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsInt()
  @IsOptional()
  order?: number;
}

