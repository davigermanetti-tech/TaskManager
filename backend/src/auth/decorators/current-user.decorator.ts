import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * CUSTOM DECORATOR: @CurrentUser()
 * ══════════════════════════════════════════════════════════════════════════════
 * Permite extrair os dados do usuário autenticado diretamente nos parâmetros
 * dos métodos dos Controllers de forma limpa e declarativa.
 *
 * Exemplo de uso:
 * @Get('me')
 * getProfile(@CurrentUser() user: any) { ... }
 *
 * Ou pegando apenas o ID:
 * @Get('me')
 * getProfile(@CurrentUser('id') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

