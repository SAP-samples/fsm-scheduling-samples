import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Context } from '../../ctx.decorator';
import { AddressDTO, TagDTO } from '../../common/dto-models';
import { FsmAPIClientFactory } from '../../common/fsm-api-client.factory';
import { DTOName } from 'fsm-sdk/release/model/DTOModels';

@Controller('api/query')
export class QueryController {

  constructor(private factory: FsmAPIClientFactory) { }

  @Post()
  async query<T>(@Context() ctx: Context, @Body() { query }: { query: string }): Promise<T> {
    return await this.factory.fromContext(ctx).query(query, Object.keys(this.factory.ALL_DTO_VERSIONS) as DTOName[])
      .then(x => x.data)
      .catch(e => { console.error(query); throw e; return undefined as any }) as T;
  }

  @Get('tags')
  async listTags(@Context() ctx: Context) {

    const data: { tag: TagDTO }[] = await this.query(ctx, { query: `SELECT tag FROM Tag tag` });

    const work = data.map(({ tag }) => {
      return this.query(ctx, { query: `SELECT it.tag, it.person FROM Skill it WHERE it.tag = '${tag.id}' LIMIT 500` })
        .then((resp: { it: { person: string } }[]) => ({ ...tag, persons: resp.map(({ it }) => it.person) }))
        .catch(error => ({ ...tag, persons: [] }));
    });

    return await Promise.all(work);
  }

  @Get('person/by-tag/:tagId')
  async resource(@Context() ctx: Context, @Param('tagId') tagId: string) {
    return await this.query(ctx, { query: `SELECT it.tag, it.person FROM Skill it WHERE it.tag = '${tagId}' LIMIT 500` });
  }

  @Get('address')
  async listAddress(@Context() ctx: Context) {
    const query = `SELECT address FROM Address address LIMIT 2500`;
    const list: { address: AddressDTO }[] = await this.query(ctx, { query });
    return list.map(x => x.address);
  }

}
