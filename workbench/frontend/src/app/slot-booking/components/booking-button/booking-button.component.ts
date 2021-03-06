import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as moment from 'moment';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { catchError, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { GroupedSearchResponse } from '../../services/slot-booking.service';
import { BookingService, Progress } from '../../services/booking.service';
import { Job } from '../../services/job.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Selectable, SelectSheet } from 'src/app/common/components/select-sheet/select-sheet.component';


@Component({
  selector: 'booking-button',
  templateUrl: './booking-button.component.html',
  styleUrls: ['./booking-button.component.scss']
})
export class BookingButtonComponent implements OnInit, OnDestroy {

  constructor(
    private bookingSerivce: BookingService,
    private snackBar: MatSnackBar,
    public sheet: MatBottomSheet,
  ) { }

  @Output() isLoading = new EventEmitter<boolean>();
  @Input() group: GroupedSearchResponse;
  @Input() disabled$: Subject<boolean>;
  @Input() job: Job;

  public isLoading$ = new BehaviorSubject(false);
  public canNotBeBooked$ = new BehaviorSubject(false);
  public progress$ = new BehaviorSubject<Progress | null>(null);

  private onDistroy$ = new Subject();

  public ngOnDestroy() {
    this.onDistroy$.next();
  }

  public ngOnInit(): void {
    this.isLoading$.pipe(
      tap(v => this.isLoading.next(v)),
      takeUntil(this.onDistroy$)
    ).subscribe();
  }


  book() {
    this.isLoading$.next(true);
    this.progress$.next(null);
    this.sheet.open(SelectSheet, {
      data: {
        list: [
          { name: 'Yes' },
          { name: 'No' }
        ] as Selectable[], headline: `Book ${moment(this.group.slot.start).format('HH:mm')}-${moment(this.group.slot.end).format('HH:mm')} - are you sure?`
      }, disableClose: true, hasBackdrop: true, autoFocus: true
    }).afterDismissed()
      .pipe(
        map((selected: Selectable) => selected.name !== 'No'),
        switchMap(ok => {
          return !ok
            ? of(null)
            : this.bookingSerivce.tryBookAll(this.group.items, this.job)
              .pipe(
                tap(progress => this.progress$.next(progress)),
                filter(progress => progress.success)
              );
        }),
        tap((progress) => {
          this.isLoading$.next(false);
          this.canNotBeBooked$.next(progress && progress.success);
          this.snackBar.open(`[✅ DONE ✅] done!`, 'ok', { duration: 3000 });
        }),
        catchError((error: Error | Progress) => {
          this.isLoading$.next(false);
          this.canNotBeBooked$.next(true);
          this.snackBar.open(`[❌ ERROR ❌] Failed to book Slot ${moment(this.group.slot.start).format('HH:mm')} - ${moment(this.group.slot.end).format('HH:mm')}`, 'ok', { duration: 3000 });
          return of(null);
        })

      ).subscribe();
  }

}
