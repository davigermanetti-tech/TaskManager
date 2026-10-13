import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterUserDto } from './dto/register.dto.js';
import { UserLoginDto } from './dto/login.dto.js';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * AUTH SERVICE — LÓGICA DE NEGÓCIO DA AUTENTICAÇÃO
 * ══════════════════════════════════════════════════════════════════════════════
 * Gerencia o registro de novos usuários com hash seguro (bcrypt),
 * validação de credenciais de login e emissão de tokens JWT assinados.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 1. REGISTRO DE USUÁRIO (POST /auth/register)
   * ──────────────────────────────────────────────────────────────────────────
   * - Verifica se o email já existe no PostgreSQL do Supabase.
   * - Gera o hash da senha com bcrypt (salt rounds = 10).
   * - Salva o usuário no banco de dados.
   * - Retorna o token JWT e dados do usuário recém-criado.
   */
  async register(registerUserDto: RegisterUserDto) {
    const { name, email, password } = registerUserDto;

    // 1.1 Verifica se o email já está em uso
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        'Este endereço de email já está cadastrado em outra conta.',
      );
    }

    // 1.2 Criptografa a senha usando o bcrypt com 10 rounds de salt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 1.3 Salva o novo usuário no PostgreSQL
    const newUser = await this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    // 1.4 Gera o token JWT para o usuário já iniciar logado
    const token = await this.generateToken(
      newUser.id,
      newUser.email,
      newUser.name,
    );

    return {
      user: newUser,
      ...token,
    };
  }

  /**
   * 2. LOGIN DE USUÁRIO (POST /auth/login)
   * ──────────────────────────────────────────────────────────────────────────
   * - Busca o usuário pelo email.
   * - Compara a senha informada com o hash criptografado salvo no banco.
   * - Retorna o token JWT e os dados do usuário logado.
   */
  async login(userLoginDto: UserLoginDto) {
    const { email, password } = userLoginDto;

    // 2.1 Busca o usuário no banco de dados
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Se o usuário não existir, lança erro genérico (defesa contra enumeração de usuários)
    if (!user) {
      throw new UnauthorizedException('Email ou senha incorretos.');
    }

    // 2.2 Compara a senha digitada com o hash salvo no banco
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou senha incorretos.');
    }

    // 2.3 Gera o token JWT de acesso
    const token = await this.generateToken(user.id, user.email, user.name);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      ...token,
    };
  }

  /**
   * 3. PERFIL DO USUÁRIO LOGADO (GET /auth/me)
   * ──────────────────────────────────────────────────────────────────────────
   * Retorna os dados do usuário autenticado usando o ID extraído do token JWT.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  /**
   * 4. MÉTODO PRIVADO AUXILIAR: GERAÇÃO DO TOKEN JWT
   * ──────────────────────────────────────────────────────────────────────────
   * Cria o payload padronizado e assina digitalmente com a chave secreta.
   */
  private async generateToken(userId: string, email: string, name: string) {
    const payload = {
      sub: userId, // 'sub' (Subject) é o padrão oficial para o identificador único
      email,
      name,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
    };
  }
}