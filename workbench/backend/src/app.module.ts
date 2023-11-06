import { HttpModule, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
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
import { ErrorFilter } from './common/error.filter';
import { TechnicianController } from './app/technician/technician.controller';
import { AghApiDao } from './app/technician/agh-api.dao';

@Module({
  imports: [HttpModule],
  controllers: [
    BookingController,
    JobSlotsController,
    PluginController,
    QueryController,
    ReOptimizeController,
    AppController,
    TechnicianController
  ],
  providers: [
    AiDataAPIDAO,
    OptimisationAPIDAO,
    ServiceManagementAPIDAO,
    FsmAPIClientFactory,
    AghApiDao,
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_FILTER, useClass: ErrorFilter }
  ],
})
export class AppModule { }
