import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as moment from 'moment';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, delay, filter, map, mergeMap, take, tap } from 'rxjs/operators';
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
export class ReOptimizeComponent implements OnInit {

  public isLoading$ = new BehaviorSubject<boolean>(false);
  public isLoggedIn$: Observable<boolean>;
  public response$ = new BehaviorSubject<ReOptimizeReponseWrapper | null>(null);
  public requestPayload$: Observable<ReOptimizeRequest>;
  public pluginEditor$ = new BehaviorSubject<string | null>(null);
  public personIds$ = new BehaviorSubject<string[]>([]);
  public optimationsSpan$ = new BehaviorSubject<OptimisaionSpan>(null);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private service: ReOptimizeService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.isLoggedIn$ = this.auth.isLoggedIn$;

    this.requestPayload$ = combineLatest([this.pluginEditor$, this.personIds$, this.optimationsSpan$])
      .pipe(
        filter(([pluginEditor, personIds, span]) => !!(pluginEditor
          && personIds.length
          && span
          && span.start
          && span.end
          && span.activityIds.length)),
        map(([pluginEditor, personIds, span]): ReOptimizeRequest => {

          return {
            activityIds: span.activityIds,
            optimizationPlugin: pluginEditor,
            start: span.start,
            end: span.end,
            releaseOnSchedule: true,
            skipLocking: true,
            // partitioningStrategy: {    skills: ["string"]   },
            resources: {
              includeInternalPersons: true,
              includeCrowdPersons: true,
              personIds: [
                ...personIds
              ]
            },
            additionalDataOptions: {
              useBlacklist: true,
              enableRealTimeLocation: true,
              realTimeLocationThresholdInMinutes: 0,
              includePlannedJobsAsBookings: true,
              includeReleasedJobsAsBookings: true
            }
          }
        })
      );
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

    this.requestPayload$.pipe(
      take(1),
      mergeMap(payload => {

        console.log(JSON.stringify(payload, null, 2));

        return this.service.doRequest(payload).pipe(
          catchError((error) => {
            this.isLoading$.next(false);

            let errorMessage = error;
            if (error instanceof HttpErrorResponse) {
              errorMessage = `[❌ ERROR ❌] [${error.status}]\n\n${error.message}`;
            }

            const snackBarRef = this.snackBar.open(errorMessage, 'ok', { duration: 3000 });
            console.error(error);
            return of({
              isError: true,
              errorMessage,
              time: -1,
              grouped: [],
              result: false
            })

          })
        )
      }),
      tap(value => {
        this.isLoading$.next(false)
        if (value) {
          this.response$.next(value);
        }
      })
    ).subscribe()
  }
}
