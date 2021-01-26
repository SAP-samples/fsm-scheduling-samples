import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, merge, of, Subject } from 'rxjs';
import { catchError, mergeMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { ResourceQueryService } from '../../services/resource-query.service';

const TEMPLATES = {
  default: `
SELECT 
  resource.id as id,
  resource.firstName as firstName,
  resource.lastName as lastName
FROM 
  UnifiedPerson resource 
WHERE 
  resource.plannableResource = true 
  AND resource.inactive != true
LIMIT 25
`,
  skill: `
SELECT 
  resource.id as id,
  resource.firstName as firstName,
  resource.lastName as lastName
FROM 
  Tag tag 
  LEFT JOIN Skill skill ON skill.tag = tag.id
  LEFT JOIN UnifiedPerson resource ON resource.id = skill.person
WHERE
  resource.plannableResource = true 
  AND resource.inactive != true 
  AND tag.name = '<insert-skill-here>'
LIMIT 25
`,
  region: `
SELECT
  resource.id as id,
  resource.firstName as firstName,
  resource.lastName as lastName
FROM 
  UnifiedPerson resource 
  LEFT JOIN Region region ON region.name = '<insert-region-here>'
WHERE 
  region.id IN resource.regions
  AND resource.plannableResource = true 
  AND resource.inactive != true 
LIMIT 25
`
}


@Component({
  selector: 'resource-query',
  templateUrl: './resource-query.component.html',
  styleUrls: ['./resource-query.component.scss']
})
export class ResourceQueryComponent implements OnInit {

  private onQuery = new Subject();
  public resources$ = new BehaviorSubject<Partial<{ id: string; firstName: string, lastName: string }>[]>([]);
  public isLoading$ = new BehaviorSubject<boolean>(false);

  @Output() change = new EventEmitter<string[]>();

  public form: FormGroup;
  private onDistroy$ = new Subject();
  public editorOptions = {
    theme: 'vs-dark',
    language: 'pgsql',
    fontSize: 15
  };

  constructor(
    private fb: FormBuilder,
    private svc: ResourceQueryService,
    private snackBar: MatSnackBar,
  ) { }
  public ngOnDestroy() {
    this.onDistroy$.next();
  }

  public ngOnInit(): void {
    this.form = this.fb.group({
      query: [TEMPLATES.default],
    });

    this.resources$.pipe(
      tap(list => {
        if (list.length) {
          this.change.next(list.map(it => it.id));
        }
      }),
      takeUntil(this.onDistroy$)
    ).subscribe();

    this.onQuery.pipe(
      withLatestFrom(merge(of(this.form.value), this.form.valueChanges)),
      mergeMap(([_, form]) => {
        this.isLoading$.next(true);
        return this.svc.query<{ id: string, lastName: string, firstName: string }>(form.query).pipe(
          catchError(error => {
            console.error(error);

            let errorMessage = error;
            if (error instanceof HttpErrorResponse) {
              errorMessage = `Error [❌ ${error.status} ❌ ]\n\n${error.message}`;
            }

            const snackBarRef = this.snackBar.open(errorMessage, 'ok', { duration: 3000 });

            return of([]);
          })
        )
      }),
      tap(list => {
        this.isLoading$.next(false);
        this.resources$.next(list);
      }),
      takeUntil(this.onDistroy$)
    ).subscribe();

    setTimeout(() => this.onQuery.next(), 100);
  }

  public onEditor(editor) {
    //let line = editor.getPosition();
    // console.log(editor);
  }

  public remove(item: { id: string }) {
    this.resources$.pipe(
      take(1),
      tap(current => this.resources$.next(current.filter(it => it.id !== item.id)))
    ).subscribe();
  }

  public doQuery() {
    this.onQuery.next();
  }

  public applyTmpl(t: keyof typeof TEMPLATES) {
    this.form.patchValue({ query: TEMPLATES[t] });
  }

}
