import { Body, Controller, Post, Res } from '@nestjs/common';
import { Context } from '../../ctx.decorator';
import { OptimisationAPIDAO, SearchRequest } from '../../common/optimisation-api.dao';
import { AxiosError } from 'axios';
import { Response } from 'express';

@Controller('api/job-slots')
export class JobSlotsController {

  constructor(private dao: OptimisationAPIDAO) { }

  @Post('actions/search')
  async create(@Res() res: Response, @Context() ctx: Context, @Body() searchReq: SearchRequest) {
    try {
      const { data } = await this.dao.slotsSearch(ctx, searchReq).toPromise();
      return res.json(data);
    } catch ({ error }) {

      let axiosError: AxiosError = error;
      return res
        .status(parseInt(axiosError?.code || '500'))
        .json(axiosError?.response?.data);

    }
  }

}
