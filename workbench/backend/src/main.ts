import express = require('express');
import path = require('path');
import { NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configService } from './common/config.service';

const config: NestApplicationOptions = {
  cors: true,
  logger: configService.isProduction() ? console : undefined,
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, config);
  app.use('/app', express.static(path.join(__dirname, '/static/frontend')));
  await app.listen(configService.getPort());
  console.log(`Application now running on => open http://localhost:${configService.getPort()}`);
}

bootstrap();
