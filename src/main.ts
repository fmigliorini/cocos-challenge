import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, PinoLogger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * ValidationPipe
   *
   * This pipe is used to validate the request body.
   * It transforms the request body to the DTO class.
   * It also whitelists the request body and forbids non-whitelisted properties.
   */
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  /**
   * SwaggerModule
   *
   * This module is used to create the Swagger document.
   * It is used to generate the Swagger UI.
   * 
   * path: /docs
   */
  const config = new DocumentBuilder()
    .setTitle('Cocos Challenge')
    .setDescription('Cocos Challenge API')
    .setVersion('1.0')
    .addTag('Cocos Challenge')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useLogger(app.get(Logger));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
