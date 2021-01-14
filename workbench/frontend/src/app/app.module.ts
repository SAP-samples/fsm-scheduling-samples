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
import { LoginDialogComponent } from './common/login-dialog/login-dialog.component';
import { AuthService } from './common/login-dialog/auth.service';
import { MatModules } from './common/material.modules';
import { ConfigService } from './common/config.service';
import { ngxMonacoEditorConfig } from './common/editor.conf';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { SlotBookingComponent } from './slot-booking/slot-booking.component';

import { SlotBuilderComponent } from './slot-booking/components/slot-builder/slot-builder.component';
import { BookingButtonComponent } from './slot-booking/components/booking-button/booking-button.component';
import { MapComponent } from './slot-booking/components/map/map.component';
import { JobBuilderComponent } from './slot-booking/components/job-builder/job-builder.component';
import { ResourceQueryComponent } from './slot-booking/components/resource-query/resource-query.component';

import { BookingService } from './slot-booking/services/booking.service';
import { ResourceQueryService } from './slot-booking/services/resource-query.service';
import { SlotService } from './slot-booking/services/slot.service';


import { PluginEditorComponent } from './plugin-editor/plugin-editor.component';
import { PluginService } from './plugin-editor/plugin.service';
import { SaveDialog } from './plugin-editor/dialogs/save-dialog.component';



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
    BookingButtonComponent
  ],
  entryComponents: [SaveDialog],
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
    SlotService,
    ResourceQueryService,
    BookingService,
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
