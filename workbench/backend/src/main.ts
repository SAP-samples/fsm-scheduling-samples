import express = require('express');
import path = require('path');
import { NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const isProduction = false;

const config: NestApplicationOptions = {
  cors: true,
  logger: isProduction ? console : undefined,
};


async function bootstrap() {
  const app = await NestFactory.create(AppModule, config)

  app.use('/app', express.static(path.join(__dirname, '/static/frontend')))

  const port = process.env.PORT || 8000;
  await app.listen(port);
  console.log(`Application now running on => open http://localhost:${port}`);
}
bootstrap();
