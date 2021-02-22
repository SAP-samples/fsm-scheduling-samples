import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { LoginDialogComponent } from './common/components/login-dialog/login-dialog.component';
import { AuthService } from './common/services/auth.service';
import { MatModules } from './common/material.modules';
import { ConfigService } from './common/services/config.service';
import { ngxMonacoEditorConfig } from './common/editor.conf';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { SlotBookingComponent } from './slot-booking/slot-booking.component';

import { SlotBuilderComponent } from './slot-booking/components/slot-builder/slot-builder.component';
import { BookingButtonComponent } from './slot-booking/components/booking-button/booking-button.component';
import { MapComponent } from './slot-booking/components/map/map.component';
import { JobBuilderComponent } from './slot-booking/components/job-builder/job-builder.component';

import { BookingService } from './slot-booking/services/booking.service';


import { ReOptimizeComponent } from './re-optimize/re-optimize.component';
import { ReOptimizeService } from './re-optimize/services/re-optimize.service';
import { OptimisationTargetComponent } from './re-optimize/components/optimisation-target/optimisation-target.component';


import { PluginService } from './common/services/plugin.service';
import { QueryService } from './common/services/query.service';
import { ResourceQueryComponent } from './common/components/resource-query/resource-query.component';

import { SaveDialog } from './common/components/plugin-editor/save-dialog/save-dialog.component';
import { SelectSheet } from './common/components/select-sheet/select-sheet.component';
import { PluginEditorComponent } from './common/components/plugin-editor/plugin-editor.component';


@NgModule({
  declarations: [
    AppComponent,
    SlotBookingComponent,
    LoginDialogComponent,
    SlotBuilderComponent,
    PluginEditorComponent,
    SaveDialog,
    JobBuilderComponent,
    MapComponent,
    ResourceQueryComponent,
    BookingButtonComponent,
    ReOptimizeComponent,
    OptimisationTargetComponent,
    SelectSheet
  ],
  entryComponents: [SaveDialog, SelectSheet],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MonacoEditorModule.forRoot(ngxMonacoEditorConfig),
    FlexLayoutModule,
    ...MatModules
  ],
  providers: [
    ConfigService,
    AuthService,
    PluginService,
    BookingService,
    QueryService,
    BookingService,
    ReOptimizeService,
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { floatLabel: 'always' } },
    { provide: MAT_DATE_LOCALE, useValue: 'de-de' },
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: ['YYYY-MM-DD HH:mm'],
        },
        display: {
          dateInput: 'YYYY-MM-DD HH:mm',
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
