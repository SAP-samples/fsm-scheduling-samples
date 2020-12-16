import { HttpModule, Module } from '@nestjs/common';
import { AiDataAPIDAO } from './plugin/ai-data-api.dao';
import { PluginController } from './plugin/plugin.controller';
import { QueryController } from './query/query.controller';
import { AppController } from './app.controller';
import { JobSlotsController } from './job-slots/job-slots.controller';
import { OptimisationAPIDAO } from './job-slots/optimisation-api.dao';
import { BookingController } from './booking/booking.controller';
import { ServiceManagementAPIDAO } from './booking/service-management-api.dao';
import { FsmAPIClientFactory } from './common/fsm-api-client.factory';

@Module({
  imports: [HttpModule],
  controllers: [
    BookingController,
    JobSlotsController,
    PluginController,
    QueryController,
    AppController
  ],
  providers: [
    AiDataAPIDAO,
    OptimisationAPIDAO,
    ServiceManagementAPIDAO,
    FsmAPIClientFactory
  ],
})
export class AppModule { }
