import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import path from 'path';
import fs from 'fs';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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

  // Habilita o servidor de arquivos estáticos para o frontend do Kanban
  const candidatePaths = [
    path.resolve(process.cwd(), 'public'),
    path.resolve(process.cwd(), '../public'),
    path.resolve(process.cwd(), '..'),
  ];
  for (const candidate of candidatePaths) {
    if (fs.existsSync(path.join(candidate, 'index.html'))) {
      app.useStaticAssets(candidate);
      console.log(`📁 Frontend estático servido a partir de: ${candidate}`);
      break;
    }
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Task Manager API rodando com sucesso na porta ${port}`);
}
await bootstrap();
