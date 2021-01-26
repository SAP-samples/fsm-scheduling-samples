import { HttpModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { FsmAPIClientFactory } from './common/fsm-api-client.factory';
import { BookingController } from './app/booking/booking.controller';
import { PluginController } from './app/plugin/plugin.controller';
import { QueryController } from './app/query/query.controller';
import { JobSlotsController } from './app/job-slots/job-slots.controller';
import { AiDataAPIDAO } from './app/plugin/ai-data-api.dao';
import { OptimisationAPIDAO } from './common/optimisation-api.dao';
import { ServiceManagementAPIDAO } from './app/booking/service-management-api.dao';
import { TimeoutInterceptor } from './common/timeout.interceptor';
import { ReOptimizeController } from './app/re-optimize/re-optimize.controller';

@Module({
  imports: [HttpModule],
  controllers: [
    BookingController,
    JobSlotsController,
    PluginController,
    QueryController,
    ReOptimizeController,
    AppController
  ],
  providers: [
    AiDataAPIDAO,
    OptimisationAPIDAO,
    ServiceManagementAPIDAO,
    FsmAPIClientFactory,
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor }
  ],
})
export class AppModule { }
