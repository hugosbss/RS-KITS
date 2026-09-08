import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { existsSync } from 'fs';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.useBodyParser('json', { limit: '50mb' });
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Modo "servidor único" (LAN/Internet): serve o frontend estático + API +
  // downloads na MESMA origem (sem CORS, sem depender de localhost).
  // Defina FRONTEND_DIR=./web (pasta com o build do Next) para ativar.
  const frontendDir = process.env.FRONTEND_DIR;
  if (frontendDir && existsSync(frontendDir)) {
    app.useStaticAssets(frontendDir);
    const indexPath = join(frontendDir, 'index.html');
    app.use((req: any, res: any, next: any) => {
      if (
        req.method === 'GET' &&
        !req.path.startsWith('/api/') &&
        !req.path.includes('.')
      ) {
        return res.sendFile(indexPath);
      }
      next();
    });
  }

  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`RS KITS backend rodando em http://localhost:${port}/api`);
}
bootstrap();
