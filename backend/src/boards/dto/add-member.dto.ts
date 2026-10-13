import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * DTO: ADD MEMBER (POST /boards/:id/members)
 * ══════════════════════════════════════════════════════════════════════════════
 */
export class AddMemberDto {
  @IsString({ message: 'O ID do usuário deve ser um texto' })
  @IsNotEmpty({ message: 'O ID do usuário é obrigatório' })
  userId: string;

  @IsString({ message: 'O papel do membro deve ser um texto' })
  @IsOptional()
  role?: string;
}

