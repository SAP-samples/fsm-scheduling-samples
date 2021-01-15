import { Controller, Get, Res, Req } from '@nestjs/common';
import * as express from 'express';

@Controller()
export class AppController {

  constructor() { }

  @Get()
  async redirectToApp(@Res() response: express.Response, @Req() request: express.Request) {
    return response.redirect(303, `/app`);
  }
}