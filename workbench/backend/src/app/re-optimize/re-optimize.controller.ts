import { Body, Controller, Post, Res } from '@nestjs/common';
import { Context } from '../../ctx.decorator';
import { AxiosError } from 'axios';
import { Response } from 'express';
import { OptimisationAPIDAO, ReOptimizeRequest } from 'src/common/optimisation-api.dao';


@Controller('api/re-optimize')
export class ReOptimizeController {

  constructor(
    private dao: OptimisationAPIDAO
  ) { }

  @Post('actions/sync')
  async doSync(@Res() res: Response, @Context() ctx: Context, @Body() body: ReOptimizeRequest) {
    try {
      const { data } = await this.dao.reOptimize('sync', ctx, body).toPromise();
      return res.json(data);
    } catch (e) {
      let axiosError: AxiosError = e?.error;
      return res
        .status(axiosError?.response?.status || 500)
        .json(axiosError?.response?.data);
    }
  }
  @Post('actions/async')
  async doAsync(@Res() res: Response, @Context() ctx: Context, @Body() body: ReOptimizeRequest) {
    try {
      const { data } = await this.dao.reOptimize('async', ctx, body).toPromise();
      return res.json(data);
    } catch (e) {
      let axiosError: AxiosError = e?.error;
      return res
        .status(axiosError?.response?.status || 500)
        .json(axiosError?.response?.data);
    }
  }
}
