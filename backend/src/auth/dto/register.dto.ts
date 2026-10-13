import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';


/**
 * ══════════════════════════════════════════════════════════════════════════════
 * DTO: REGISTER USER (Data Transfer Object)
 * ══════════════════════════════════════════════════════════════════════════════
 * Define o formato esperado no corpo (JSON) da requisição POST /users.
 * Os decorators do class-validator validam os dados automaticamente antes de
 * chegarem ao Controller ou ao Service.
 */

export class RegisterUserDto {
    @IsString({ message: 'O nome do usuário deve ser um texto' })
    @IsNotEmpty({ message: 'O nome do usuário é obrigatório' })
    name: string;

    @IsEmail({}, { message: 'O email deve ser um endereço de email válido'})
    @IsNotEmpty({ message: 'O email é obrigatório' })
    email: string;

    @IsString({ message: 'A senha deve ser um texto'})
    @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres'})
    password: string;

}