import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita validação automática com base nos DTOs
  // whitelist: true remove automaticamente qualquer campo indesejado enviado no corpo da requisição (segurança contra Mass Assignment)
  // transform: true converte os payloads para instâncias tipadas das classes DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Habilita o CORS para que qualquer frontend local (ex: Live Server na porta 5500/5501)
  // consiga fazer requisições HTTP para a nossa API na porta 3000
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Task Manager API rodando com sucesso na porta ${port}`);
}
await bootstrap();
