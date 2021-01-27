import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, merge, Subject } from 'rxjs';
import { filter, map, mergeMap, pairwise, take, takeUntil, tap } from 'rxjs/operators';
import * as moment from 'moment';
import { of, combineLatest } from 'rxjs';
import { QueryService } from 'src/app/common/services/query.service';

export type OptimisaionSpan = { start: string, end: string, activityIds: string[] };

const HTML_INPUT_DATE_FORMAT = 'YYYY-MM-DDTHH:mm';
const toHTMLDate = (v: moment.MomentInput) => (moment(v).format(HTML_INPUT_DATE_FORMAT));
const fromHTMLDate = (v: moment.MomentInput) => (moment(v, HTML_INPUT_DATE_FORMAT).format('YYYY-MM-DDTHH:mm:ss') + '.000Z');


@Component({
  selector: 'optimisation-target',
  templateUrl: './optimisation-target.component.html',
  styleUrls: ['./optimisation-target.component.scss']
})
export class OptimisationTargetComponent implements OnInit, OnDestroy {

  @Output() change = new EventEmitter<OptimisaionSpan>();
  public form: FormGroup;
  private onDistroy$ = new Subject();
  public activityList$ = new BehaviorSubject<{ id: string }[]>([]);

  constructor(
    private fb: FormBuilder,
    private query: QueryService,
  ) { }

  public ngOnDestroy() {
    this.onDistroy$.next();
  }
  ngOnInit(): void {
    this.form = this.fb.group({
      start: [undefined, Validators.required],
      end: [undefined, Validators.required],
      limit: [50, Validators.required],
    });

    // sync changes outside
    combineLatest([this.form.valueChanges, this.activityList$]).pipe(
      tap(([{ start, end }, activityList]) => {
        if (start && end && !!activityList.length) {
          const result: OptimisaionSpan = {
            start: fromHTMLDate(start),
            end: fromHTMLDate(end),
            activityIds: activityList.map(x => x.id)
          }
          this.change.next(result);
        }
      }),
      takeUntil(this.onDistroy$)
    ).subscribe();

    // sync date changes and search for matching activities
    merge(of(this.form.value), this.form.valueChanges).pipe(
      map((form) => {
        const startDateTime = QueryService.trimMilliseconds(fromHTMLDate(form.start))
        const endDateTime = QueryService.trimMilliseconds(fromHTMLDate(form.end))
        return { startDateTime, endDateTime, limit: form.limit }
      }),

      // only tigger query if startDateTime/endDateTime changed
      pairwise(),
      filter(([last, current], index) => index === 0 || JSON.stringify(last) !== JSON.stringify(current)),
      map(([_, current]) => current),

      map(({ startDateTime, endDateTime, limit }) => {
        return `
        SELECT 
          activity.id as id,  
          activity.subject as subject 
        FROM 
          Activity activity 
        WHERE 
          activity.executionStage != 'CANCELLED' 
          AND activity.status != 'CLOSED' 
          AND activity.address IS NOT NULL 
          AND (
            (activity.startDateTime >= '${startDateTime}' AND activity.endDateTime <= '${endDateTime}')
            OR 
            (activity.earliestStartDateTime >= '${startDateTime}' AND activity.dueDateTime <= '${endDateTime}')
          )
        LIMIT ${limit}`
      }),
      mergeMap(query => {
        return this.query.queryActivities(query);
      }),
      tap(list => {
        this.activityList$.next(list);
      }),
      takeUntil(this.onDistroy$)
    ).subscribe();


    const range = 14;
    // initial form values 
    this.form.patchValue({
      start: toHTMLDate(moment(new Date()).add(-1, 'years').hour(0).minute(0).second(0)), // set this back to days not years :)
      end: toHTMLDate(moment(new Date()).add(range + 1, 'years').hour(0).minute(0).second(0))
    });

  }

  public getDuration(it: { start: string, end: string }) {
    const diff = moment.duration(moment(it.end, HTML_INPUT_DATE_FORMAT).diff(moment(it.start, HTML_INPUT_DATE_FORMAT)))
    return `${diff.asHours()} hrs | ${diff.asDays()} days`;
  }

  public remove(item: { id: string }) {
    this.activityList$.pipe(
      take(1),
      tap(current => this.activityList$.next(current.filter(it => it.id !== item.id)))
    ).subscribe();
  }

}
