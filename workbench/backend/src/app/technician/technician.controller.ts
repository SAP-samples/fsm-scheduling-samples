import { Body, Controller, Post } from '@nestjs/common';
import { Context } from '../../ctx.decorator';
import { AghApiDao } from './agh-api.dao';
import { AGHRequestDTO } from '../../common/dto-models';


@Controller('api/technicians')
export class TechnicianController {

  constructor(private dao: AghApiDao) { }

  @Post()
  async getTechnicians(@Context() ctx: Context, @Body() aghRequest: Partial<AGHRequestDTO>) {
    const { data } = await this.dao.getTechnicians(ctx, aghRequest).toPromise();
    return data;
  }

}
