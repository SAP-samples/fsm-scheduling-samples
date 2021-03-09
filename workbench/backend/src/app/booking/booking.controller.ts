import { Body, Controller, NotFoundException, Param, Post, Res, UnprocessableEntityException } from '@nestjs/common';
import { Context } from '../../ctx.decorator';
import { AxiosError } from 'axios';
import { Response } from 'express';
import { ServiceManagementAPIDAO } from './service-management-api.dao';
import { FsmAPIClientFactory } from '../../common/fsm-api-client.factory';
import { BookingDTOsBuilder } from './booking-dtos.builder';
import { CreateAction } from 'fsm-sdk/release/core/batch-action.model';


export type BookingRequest = {
  readonly bookable: BookableJobSlot,
  readonly job: Job
}

class Job {
  constructor(
    public readonly durationMinutes: number,
    public readonly location: Readonly<{ latitude: number; longitude: number; }>,
    public readonly mandatorySkills: string[],
    public readonly udfValues: Readonly<{ [key: string]: string }>,
  ) { }
}

class BookableJobSlot {
  constructor(
    public readonly slot: Readonly<{ start: string | null; end: string | null; }> = { start: null, end: null },
    public readonly resource: string | null = null,
    public readonly start: string | null = null,
    public readonly end: string | null = null,
    public readonly trip: Readonly<{ durationInMinutes: number, distanceInMeters: number }> = { durationInMinutes: 0, distanceInMeters: 0 },
    public readonly score: number = -1
  ) {
  }
}


@Controller('api/booking')
export class BookingController {

  constructor(
    private dao: ServiceManagementAPIDAO,
    private factory: FsmAPIClientFactory
  ) { }

  @Post('actions/book/:activityId')
  async create(@Res() res: Response, @Param('activityId') _activityId: string | 'create-activity', @Context() ctx: Context, @Body() bookingRequest: BookingRequest) {

    try {

      const client = this.factory.fromContext(ctx);
      const builder = BookingDTOsBuilder.from(bookingRequest);

      let activityId = _activityId !== 'create-activity'
        ? _activityId
        : undefined;

      if (_activityId === 'create-activity') {

        // create necessary FSM objects
        const related = builder.buildPlanningRelatedObjects();
        const [[{ businessPartner }], [{ address }], [{ serviceCall }], [{ activity }]] = await client.batch([
          new CreateAction('BusinessPartner', related.businessPartner),
          new CreateAction('Address', related.address),
          new CreateAction('ServiceCall', related.serviceCall),
          new CreateAction('Activity', related.activity),
        ]).then(resp => resp.map(wrapper => wrapper.body.data));

        activityId = activity.id;

      }

      if (!activityId || activityId === 'create-activity') {
        throw new NotFoundException('?');
      }

      try {
        // book -> plan & release
        const _planResult = await this.dao.plan(ctx, activityId, builder.buildPlanningRequest()).toPromise().then(x => x.data);
        const _releaseResult = await this.dao.release(ctx, activityId).toPromise().then(x => x.data);

        return res.json({ activityId });

      } catch (error) {
        throw activityId
          ? new UnprocessableEntityException(activityId)
          : error;
      }

    } catch (e) {

      if (e instanceof UnprocessableEntityException) {
        return res
          .status(e.getStatus())
          .json({ activityId: e.message });
      }

      let axiosError: AxiosError = e?.error;
      return res
        .status(axiosError?.response?.status || 500)
        .json(axiosError?.response?.data);

    }
  }

}
