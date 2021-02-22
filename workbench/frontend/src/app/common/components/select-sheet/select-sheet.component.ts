import { Component, OnInit, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { BehaviorSubject } from 'rxjs';


export type Selectable = { name: string; id?: number | string; }

@Component({
  selector: 'select-dialog',
  template: `
  <h2>{{ data.headline }}</h2>
  <mat-nav-list>
    <mat-list-item *ngFor="let item of (list$ | async); index as j" (click)="select(item)" style="cursor: pointer;">
      <span mat-line> {{ item.name }} <span *ngIf="!!item.id">({{ item.id }})</span> </span>
    </mat-list-item>
  </mat-nav-list>`,
  styleUrls: []
})
export class SelectSheet implements OnInit {
  list$ = new BehaviorSubject<Selectable[]>([]);
  constructor(
    public ref: MatBottomSheetRef<SelectSheet>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { list: Selectable[], headline: string },
  ) { }

  ngOnInit() {
    this.list$.next(this.data.list);
  }

  select(it: Selectable) {
    this.ref.dismiss(it);
  }
}