import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * DTO: USER LOGIN (Data Transfer Object)
 * ══════════════════════════════════════════════════════════════════════════════
 * Define o formato esperado no corpo (JSON) da requisição POST /login.
 * Os decorators do class-validator validam os dados automaticamente antes de
 * chegarem ao Controller ou ao Service.
 */

export class UserLoginDto {
    @IsEmail({}, { message: 'O email deve ser um endereço de email válido' })
    @IsNotEmpty({ message: 'O email é obrigatório' })
    email: string;

    @IsString({ message: 'A senha deve ser um texto' })
    @IsNotEmpty({ message: 'A senha é obrigatória' })
    password: string;
}