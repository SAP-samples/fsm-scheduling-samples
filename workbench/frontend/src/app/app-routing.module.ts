import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SlotSearchComponent } from './slot-search/slot-search.component';

const routes: Routes = [
  { path: 'slot-search', component: SlotSearchComponent },
  { path: '', redirectTo: 'slot-search', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true, onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
