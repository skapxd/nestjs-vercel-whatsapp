import { ValidationError } from '@nestjs/class-validator';
import {
  INestApplication,
  PreconditionFailedException,
  ValidationPipe,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  buildSwaggerHTML,
  buildSwaggerInitJS,
} from '@nestjs/swagger/dist/swagger-ui';
import { AllExceptionsHandler } from './AllExceptionsHandler';
import { SwaggerTheme } from 'swagger-themes';
import { SwaggerThemeNameEnum } from 'swagger-themes/build/enums/swagger-theme-name';
import { writeFile } from 'fs/promises';

export function mainConfig(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      enableDebugMessages: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        throw new PreconditionFailedException(validationErrors);
      },
    }),
  );

  const httpRef = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new AllExceptionsHandler(httpRef.httpAdapter.getHttpServer()),
  );

  const theme = new SwaggerTheme();

  const config = new DocumentBuilder()
    .setTitle('WhatsApp example')
    .setDescription('The WhatsApp API description')
    .setVersion('1.0')
    .addTag('send message')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config, {});

  // // @ts-expect-error: err
  const html = buildSwaggerHTML('/', document, {
    explorer: true,
    customCss: theme.getBuffer(SwaggerThemeNameEnum.DARK),
    customJsStr: buildSwaggerInitJS(document),
  });
  writeFile('swagger.html', html);

  // SwaggerModule.setup('/', app, document, {
  //   explorer: true,
  //   customCss: theme.getBuffer(SwaggerThemeNameEnum.DARK),
  // });
}
