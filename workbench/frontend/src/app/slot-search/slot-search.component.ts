import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, } from '@angular/core';
import { FormBuilder, FormGroup, } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, filter, map, mergeMap, pairwise, take, takeUntil, tap } from 'rxjs/operators';
import { Job } from '../job-builder/job-builder.component';
import { AuthService } from '../common/login-dialog/auth.service';
import { PluginEditorData } from '../plugin-editor/plugin-editor.component';
import { Slot } from '../slot-builder/slot-builder.component';
import { OptimizationService, SearchRequest, SearchResponseWrapper } from './optimization.service';

@Component({
  selector: 'slot-search',
  templateUrl: './slot-search.component.html',
  styleUrls: ['./slot-search.component.scss']
})
export class SlotSearchComponent implements OnInit, OnDestroy {

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

  constructor(
    private fb: FormBuilder,
    private service: OptimizationService,
    private auth: AuthService,
    private snackBar: MatSnackBar,
  ) { }

  public ngOnInit(): void {

    const autoRefresh$ = new Observable((op) => {
      const timer = setInterval(() => {
        const { refresh } = this.requestOptions.value
        if (refresh && !this.isLoading$.value && !!this.response$.value && !this.response$.value.isError) {
          this.doRequest();
          op.next();
        }
      }, 5000) as any;

      return () => {
        clearInterval(timer);
      }
    });

    autoRefresh$.pipe(
      takeUntil(this.onDistroy$)
    ).subscribe();


    this.isLoggedIn$ = this.auth.isLoggedIn$;
    this.requestPayload$ = combineLatest([this.pluginEditor$, this.slotBuilder$, this.jobBuilder$, this.personIds$])
      .pipe(
        filter(([pluginEditor, slots, job, personIds]) => !!(pluginEditor && slots && job && personIds.length)),
        map(([pluginEditor, slots, job, personIds]): SearchRequest => {
          return {

            job: {
              durationMinutes: job.durationMinutes,
              location: job.location,
              mandatorySkills: job.mandatorySkills,
              udfValues: {}
            },

            slots,

            resources: {
              personIds
            },

            options: {
              maxResultsPerSlot: 8
            },

            optimizationPlugin: pluginEditor,

          }
        })
      );


    this.requestOptions = this.fb.group({
      refresh: [false]
    });

    this.response$.pipe(
      filter(it => !!it),
      map(it => it.time),
      pairwise(),
      tap(r => console.log(r)),
      takeUntil(this.onDistroy$)
    ).subscribe();

  }

  public ngOnDestroy() {
    this.onDistroy$.next();
  }

  public onChangeSlots(windows: Slot[]) {
    this.slotBuilder$.next(windows);
  }

  public onChangePluginEditor(name: string) {
    this.pluginEditor$.next(name);
  }

  public onChangeJobBuilder(job: Job) {
    this.jobBuilder$.next(job);
  }

  public onChangePersonIds(ids: string[]) {
    this.personIds$.next(ids);
  }

  public doRequest() {

    this.isLoading$.next(true);
    this.requestPayload$.pipe(
      take(1),
      mergeMap(payload => {

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
            })

          })
        )
      }),
      tap(value => {
        this.isLoading$.next(false)
        if (value) {
          this.response$.next(value);
        }
      }),
    ).subscribe();
  }

  public bookingLoading(isLoading: boolean) {
    this.isLoading$.next(isLoading);
  }

}
