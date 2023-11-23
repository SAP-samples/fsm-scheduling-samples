import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, } from '@angular/core';
import { Form, FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, filter, map, mergeMap, pairwise, take, takeUntil, tap } from 'rxjs/operators';
import { AuthService } from '../common/services/auth.service';
import { Slot } from './components/slot-builder/slot-builder.component';
import { SlotSearchService, SearchRequest, SearchResponseWrapper, ResourceFilters } from './services/slot-booking.service';
import { Job } from './services/job.service';
import { Event } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'slot-booking',
  templateUrl: './slot-booking.component.html',
  styleUrls: ['./slot-booking.component.scss'],
  animations: [
    trigger('highlight', [
      state('start', style({
        backgroundColor: 'yellow',
      })),
      state('end', style({
        backgroundColor: 'transparent',
      })),
      transition('* => *', animate('500ms')),
    ]),
  ],
})
export class SlotBookingComponent implements OnInit, OnDestroy {

  public slotBuilder$ = new BehaviorSubject<Slot[]>([]);
  public pluginEditor$ = new BehaviorSubject<string | null>(null);
  public jobBuilder$ = new BehaviorSubject<Job | null>(null);
  public personIds$ = new BehaviorSubject<string[]>([]);
  public isLoading$ = new BehaviorSubject<boolean>(false);
  public isLoggedIn$: Observable<boolean>;
  public requestPayload$: Observable<SearchRequest>;
  public response$ = new BehaviorSubject<SearchResponseWrapper>(null);
  public requestOptions: FormGroup;
  private onDistroy$ = new Subject();

  public filterBased = false;
  public internalChecked = false;
  public crowdChecked = false;
  public skillsChecked = false;
  public filters$ = new BehaviorSubject<ResourceFilters | null>(null);

  animationState = 'end';


  constructor(
    private fb: FormBuilder,
    private service: SlotSearchService,
    private auth: AuthService,
    private snackBar: MatSnackBar,
  ) { }

  public ngOnInit(): void {

    const autoRefresh$ = new Observable((op) => {
      const timer = setInterval(() => {
        const { refresh } = this.requestOptions.value;
        if (refresh && !this.isLoading$.value && !!this.response$.value && !this.response$.value.isError) {
          this.doRequest();
          op.next();
        }
      }, 5000) as any;

      return () => {
        clearInterval(timer);
      };
    });

    autoRefresh$.pipe(
      takeUntil(this.onDistroy$)
    ).subscribe();


    this.isLoggedIn$ = this.auth.isLoggedIn$;
    this.updateRequestPayload();


    this.requestOptions = this.fb.group({
      refresh: [false],
      filterBasedToggle: [false]
    });


    this.response$.pipe(
      filter(it => !!it),
      map(it => it.time),
      pairwise(),
      // tslint:disable-next-line:no-console
      tap(r => console.debug(r)),
      takeUntil(this.onDistroy$)
    ).subscribe();

  }

  public ngOnDestroy(): void {
    this.onDistroy$.next();
  }

  public onChangeSlots(windows: Slot[]): void {
    this.slotBuilder$.next(windows);
  }

  public onChangePluginEditor(name: string): void {
    this.pluginEditor$.next(name);
  }

  public onChangeJobBuilder(job: Job): void {
    this.jobBuilder$.next(job);
  }

  public onChangePersonIds(ids: string[]): void {
    this.personIds$.next(ids);
  }

  public onCheckboxChange(): void {
    this.filters$.next(this.buildFilters());
    this.updateRequestPayload();
  }

  public onFilterBasedToggleChange(event: Event): void {
    this.filterBased = !this.filterBased;
    this.filters$.next(this.buildFilters());
    const prevRequest = this.requestPayload$?.pipe();

    this.requestPayload$.pipe(
      tap(_ => this.animationState = 'start'),
      // Add any other operators or transformations you need here
    ).subscribe(requestPayload => {
      // Process the requestPayload as needed
      this.updateRequestPayload();
      // After a short delay, reset the animation state
      setTimeout(() => {
        this.animationState = 'end';
      }, 1000); // Adjust the delay as needed
    });

  }


  private buildFilters(): ResourceFilters {
    return {filters: {
        includeInternalPersons: this.internalChecked,
        includeCrowdPersons: this.crowdChecked,
        includeMandatorySkills: this.skillsChecked
      }};
  }


  private updateRequestPayload(): void {
    this.requestPayload$ = combineLatest([
      this.pluginEditor$,
      this.slotBuilder$,
      this.jobBuilder$,
      this.personIds$,
      this.filters$
    ]).pipe(
      filter(([pluginEditor, slots, job, personIds, filters]) => !!(
        pluginEditor && slots && job && (personIds.length || filters)
      )),
      map(([pluginEditor, slots, job, personIds, filters]): SearchRequest => {
        console.log(this.filterBased ? filters : { personIds });
        return {
          job: {
            durationMinutes: job.durationMinutes,
            location: job.location,
            mandatorySkills: job.mandatorySkills,
            optionalSkills: job.optionalSkills,
            udfValues: {}
          },
          slots,
          resources: this.filterBased ? filters : { personIds },
          options: {
            maxResultsPerSlot: 8
          },
          policy: pluginEditor,
        };
      })
    );
  }

  public doRequest(): void {

    this.isLoading$.next(true);

    this.requestPayload$.pipe(
      take(1),
      mergeMap(payload => {

        console.log(payload);

        // options here

        return this.service.doRequest(payload).pipe(
          catchError((error) => {
            this.isLoading$.next(false);

            let errorMessage = error;
            if (error instanceof HttpErrorResponse) {
              errorMessage = `[❌ ERROR ❌] [${error.status}]\n\n${error.message}`;
            }

            if (error.error) {
              if (error.error.message && ['{', '['].includes((error.error.message as string)[0])) {
                try {
                  const innerJson = JSON.parse(error.error.message);
                  errorMessage += `\n\n` + JSON.stringify(innerJson, null, 2);
                } catch (error) { }
              } else {
                errorMessage += `\n\n`
                  + (typeof error.error === 'string'
                    ? error.error
                    : JSON.stringify(error.error, null, 2));
              }
            }

            const snackBarRef = this.snackBar.open(errorMessage, 'ok', { duration: 3000 });

            console.error(error);

            return of({
              isError: true,
              errorMessage,
              time: -1,
              grouped: [],
              results: []
            });

          })
        );
      }),
      tap(value => {
        this.isLoading$.next(false);
        if (value) {
          this.response$.next(value);
        }
      }),
    ).subscribe();
  }

  public bookingLoading(isLoading: boolean): void {
    this.isLoading$.next(isLoading);
  }

}
