import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Context } from '../../ctx.decorator';
import { AddressDTO, TagDTO } from '../../common/dto-models';
import { FsmAPIClientFactory } from '../../common/fsm-api-client.factory';
import { DTOName } from 'fsm-sdk/release/core/dto-name.model';

interface QueryResponse<T> {
  data: T[];
}

@Controller('api/query')
export class QueryController {

  constructor(private factory: FsmAPIClientFactory) { }

  @Post()
  async query<T>(@Context() ctx: Context, @Body() { query }: { query: string }): Promise<T> {


    const coreApiClient = this.factory.fromContext(ctx);
    const all_dto_versions = this.factory.ALL_DTO_VERSIONS
    delete all_dto_versions["CrowdExecutionRecord"] // TODO remove this line after fsm-sdk has been updated


    const dto_names = Object.keys(all_dto_versions) as DTOName[]
    return await coreApiClient.query(query, dto_names)
      .then(x =>{
        return x})
      .catch(e => {
        throw e;
        return undefined as any }) as T;
  }

  @Get('tags')
  async listTags(@Context() ctx: Context) {

    const data: QueryResponse<{ tag: TagDTO }> = await this.query(ctx, { query: `SELECT tag FROM Tag tag` });
    const work = data.data.map(({ tag }) => {
      return this.query(ctx, { query: `SELECT it.tag, it.person FROM Skill it WHERE it.tag = '${tag.id}' LIMIT 500` })
        .then((resp: QueryResponse<{ it: { person: string } }>) => ({ ...tag, persons: resp.data.map(({ it }) => it.person) }))
        .catch(error => {
          console.error("List of Tags could not be collected due to: ", error)
        return { ...tag, persons: [] };
        });
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
    const list: QueryResponse<{ address: AddressDTO }> = await this.query(ctx, { query });
    return list.data.map(x => x.address);
  }

}
