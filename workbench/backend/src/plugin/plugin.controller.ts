import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { Context } from '../ctx.decorator';
import { AiDataAPIDAO, PluginDto } from './ai-data-api.dao';

@Controller('api/plugin')
export class PluginController {

  constructor(private dao: AiDataAPIDAO) { }

  @Post()
  async create(@Context() ctx: Context, @Body() plugin: Partial<PluginDto>) {
    const { data } = await this.dao.create(ctx, plugin).toPromise();
    return data;
  }

  @Get()
  async list(@Context() ctx: Context) {
    const { data } = await this.dao.getAll(ctx).toPromise();
    return data;
  }

  @Delete(':id')
  async delete(@Context() ctx: Context, @Param('id') id: string) {
    const { data } = await this.dao.deleteById(ctx, id).toPromise();
    return data;
  }

  @Put(':id')
  async updateById(@Context() ctx: Context, @Param('id') id: string, @Body() plugin: Partial<PluginDto>) {
    const { data } = await this.dao.updateById(ctx, id, plugin).toPromise();
    return data;
  }

  @Get(':id')
  async byId(@Context() ctx: Context, @Param('id') id: string) {
    const { data } = await this.dao.getById(ctx, id).toPromise();
    return data;
  }

  @Get('by-name/:name')
  async byName(@Context() ctx: Context, @Param('name') name: string) {
    const { data } = await this.dao.getByName(ctx, name).toPromise();
    return data;
  }

}
