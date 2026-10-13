import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterUserDto } from './dto/register.dto.js';
import { UserLoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * AUTH CONTROLLER — ROTAS PÚBLICAS E PRIVADAS DE AUTENTICAÇÃO (/auth)
 * ══════════════════════════════════════════════════════════════════════════════
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register (PÚBLICA)
   * Cadastra um novo usuário e devolve o token JWT de acesso.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  /**
   * POST /auth/login (PÚBLICA)
   * Valida email e senha e devolve o token JWT.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() userLoginDto: UserLoginDto) {
    return this.authService.login(userLoginDto);
  }

  /**
   * GET /auth/me (PRIVADA — REQUER TOKEN JWT)
   * O JwtAuthGuard intercepta a chamada, valida o Bearer token e injeta
   * o usuário em @CurrentUser(). Devolve os dados do usuário autenticado.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}

