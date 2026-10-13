import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * USERS CONTROLLER — RECEPTOR DAS REQUISIÇÕES HTTP (/users)
 * ══════════════════════════════════════════════════════════════════════════════
 * Protegido com JwtAuthGuard: apenas usuários autenticados podem consultar a lista.
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users?search=nome_ou_email
   * Retorna os usuários registrados que combinam com o filtro.
   */
  @Get()
  findAll(@Query('search') search?: string) {
    return this.usersService.findAll(search);
  }
}

