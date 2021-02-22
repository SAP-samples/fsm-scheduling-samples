import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as moment from 'moment';
import { BehaviorSubject, combineLatest, merge, Observable, of, Subject } from 'rxjs';
import { catchError, filter, map, mergeMap, pairwise, take, takeUntil, tap } from 'rxjs/operators';
import { AuthService } from '../common/services/auth.service';
import { OptimisaionSpan } from './components/optimisation-target/optimisation-target.component';
import { ReOptimizeReponseWrapper, ReOptimizeService } from './services/re-optimize.service';

export type ReOptimizeRequest = {
  activityIds: string[];
  optimizationPlugin: string;
  start: string;
  end: string;
  releaseOnSchedule: boolean;
  skipLocking: boolean;
  partitioningStrategy?: { skills: string[] };
  resources?: Partial<{
    includeInternalPersons: boolean;
    includeCrowdPersons: boolean;
    personIds: string[];
  }>;
  additionalDataOptions?: Partial<{
    useBlacklist: boolean;
    enableRealTimeLocation: boolean;
    realTimeLocationThresholdInMinutes: number;
    includePlannedJobsAsBookings: boolean;
    includeReleasedJobsAsBookings: boolean;
  }>;
};


@Component({
  selector: 'app-re-optimize',
  templateUrl: './re-optimize.component.html',
  styleUrls: ['./re-optimize.component.scss']
})
export class ReOptimizeComponent implements OnInit, OnDestroy {

  public isLoading$ = new BehaviorSubject<boolean>(false);
  public isLoggedIn$: Observable<boolean>;
  public response$ = new BehaviorSubject<ReOptimizeReponseWrapper | null>(null);
  public requestPayload$ = new BehaviorSubject<ReOptimizeRequest>(null);
  public pluginEditor$ = new BehaviorSubject<string | null>(null);
  public personIds$ = new BehaviorSubject<string[]>([]);
  public optimationsSpan$ = new BehaviorSubject<OptimisaionSpan>(null);
  private onDistroy$ = new Subject();
  public requestOptions: FormGroup;
  public requestOptionsValues = {
    mode: ['async', 'sync'],
    skipLocking: [false, true],
    releaseOnSchedule: [true, false],
    includeReleasedJobsAsBookings: [false, true],
    includePlannedJobsAsBookings: [false, true],
    enableRealTimeLocation: [false, true],
    useBlacklist: [false, true],
  }

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private service: ReOptimizeService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.isLoggedIn$ = this.auth.isLoggedIn$;

    this.requestOptions = this.fb.group({
      mode: [this.requestOptionsValues.mode[0], Validators.required],
      skipLocking: [this.requestOptionsValues.releaseOnSchedule[0], Validators.required],
      releaseOnSchedule: [this.requestOptionsValues.releaseOnSchedule[0], Validators.required],
      includeReleasedJobsAsBookings: [this.requestOptionsValues.includeReleasedJobsAsBookings[0], Validators.required],
      includePlannedJobsAsBookings: [this.requestOptionsValues.includePlannedJobsAsBookings[0], Validators.required],
      enableRealTimeLocation: [this.requestOptionsValues.enableRealTimeLocation[0], Validators.required],
      useBlacklist: [this.requestOptionsValues.useBlacklist[0], Validators.required],
    });

    const formValues$ = merge(of(this.requestOptions.value), this.requestOptions.valueChanges);
    combineLatest([this.pluginEditor$, this.personIds$, this.optimationsSpan$, formValues$])
      .pipe(
        filter(([pluginEditor, personIds, span, options]) => !!(pluginEditor
          && personIds.length
          && span
          && span.start
          && span.end
          && span.activityIds.length)),
        map(([
          optimizationPlugin,
          personIds,
          { start, end, activityIds },
          { releaseOnSchedule,
            includeReleasedJobsAsBookings,
            includePlannedJobsAsBookings,
            enableRealTimeLocation,
            skipLocking, useBlacklist }
        ]): ReOptimizeRequest => {
          return {
            start, end, releaseOnSchedule, activityIds, optimizationPlugin, skipLocking,
            // partitioningStrategy: {    skills: ["string"]   },
            resources: {
              includeInternalPersons: true,
              includeCrowdPersons: true,
              personIds
            },
            additionalDataOptions: {
              useBlacklist,
              enableRealTimeLocation,
              includePlannedJobsAsBookings,
              includeReleasedJobsAsBookings,
              realTimeLocationThresholdInMinutes: 60 * 2,
            }
          };
        }),
        tap(requestPayload => {
          this.requestPayload$.next(requestPayload)
        }),
        takeUntil(this.onDistroy$)
      ).subscribe();

    this.response$.pipe(
      filter(it => !!it),
      map(it => it.time),
      pairwise(),
      tap(r => console.debug(r)),
      takeUntil(this.onDistroy$)
    ).subscribe();
  }

  public ngOnDestroy() {
    this.onDistroy$.next();
  }

  public onChangePluginEditor(name: string) {
    this.pluginEditor$.next(name);
  }

  public onChangePersonIds(ids: string[]) {
    this.personIds$.next(ids);
  }

  public onTimeSpan(span: OptimisaionSpan) {
    this.optimationsSpan$.next(span);
  }

  public doRequest() {
    this.isLoading$.next(true);
    const { mode } = this.requestOptions.value as { mode: 'sync' | 'async' };
    this.service.reOptimize(mode, this.requestPayload$.value).pipe(
      take(1),
      catchError((error) => {
        this.isLoading$.next(false)
        let errorMessage = error instanceof HttpErrorResponse
          ? `[❌ ERROR ❌] [${error.status}]\n\n${error.message}`
          : error;
        const snackBarRef = this.snackBar.open(errorMessage, 'ok', { duration: 3000 });
        console.error(error);
        return of({ isError: true, errorMessage, time: -1, result: false })
      }),
      tap(value => {
        this.isLoading$.next(false)
        this.response$.next(value);
      })
    ).subscribe();
  }
}
