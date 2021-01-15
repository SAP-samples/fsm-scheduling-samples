import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReOptimizeComponent } from './re-optimize/re-optimize.component';
import { SlotBookingComponent } from './slot-booking/slot-booking.component';

const routes: Routes = [
  { path: 'slot-booking', component: SlotBookingComponent },
  { path: 're-optimize', component: ReOptimizeComponent },
  { path: '', redirectTo: 'slot-booking', pathMatch: 'full' },


];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true, onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
