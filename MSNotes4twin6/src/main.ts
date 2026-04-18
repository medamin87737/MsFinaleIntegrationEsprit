import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { applySpringCloudEnv } from './config-server.bootstrap';
import { AppModule } from './app.module';
import { ForbiddenJsonFilter } from './auth/forbidden-json.filter';
import { startEurekaClient } from './eureka/register-eureka';
async function bootstrap() {
  await applySpringCloudEnv('MSNotes4twin6');
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new ForbiddenJsonFilter());
  // CORS : géré par la gateway uniquement (appels navigateur → Vite proxy → gateway).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 8088;
  await app.listen(port);

  if (process.env.SKIP_EUREKA !== '1' && process.env.SKIP_EUREKA !== 'true') {
    startEurekaClient({
      appName: 'MSNotes4twin6',
      port,
    });
  }
}

bootstrap();
