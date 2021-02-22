import express = require('express');
import path = require('path');
import { NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configService } from './common/config.service';
import { ErrorFilter } from './common/error.filter';

const config: NestApplicationOptions = {
  cors: true,
  logger: configService.isProduction() ? console : undefined,
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, config);
  app.use('/app', express.static(path.join(__dirname, '/static/frontend')));
  app.useGlobalFilters(new ErrorFilter());
  await app.listen(configService.getPort());
  console.info(`Application now running on => open http://localhost:${configService.getPort()}`);
}

bootstrap();
