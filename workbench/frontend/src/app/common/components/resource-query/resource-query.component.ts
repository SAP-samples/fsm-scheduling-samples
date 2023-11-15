import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, merge, of, Subject } from 'rxjs';
import { catchError, mergeMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { QueryService } from '../../services/query.service';

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
};

@Component({
  selector: 'resource-query',
  templateUrl: './resource-query.component.html',
  styleUrls: ['./resource-query.component.scss']
})
export class ResourceQueryComponent implements OnInit, OnDestroy {

  private onQuery = new Subject();
  public resources$ = new BehaviorSubject<Partial<{ id: string; firstName: string, lastName: string }>[]>([]);
  public isLoading$ = new BehaviorSubject<boolean>(false);

  public allSkills = [];
  public skillResourcesMap: Map<string, any[]> = new Map();
  public allResources: any[] = [];
  public selectedSkills: string[] = [];


  @Output() change = new EventEmitter<string[]>();

  public form: FormGroup;
  private onDestroy$ = new Subject();
  public editorOptions = {
    theme: 'vs-dark',
    language: 'pgsql',
    fontSize: 15
  };

  constructor(
    private fb: FormBuilder,
    private svc: QueryService,
    private snackBar: MatSnackBar,
  ) { }

  public ngOnDestroy(): void {
    this.onDestroy$.next();
  }

  public ngOnInit(): void {
    this.form = this.fb.group({
      query: [TEMPLATES.default],
      selectedSkills: []
    });

    this.svc.queryResource(TEMPLATES.default).subscribe(resources => {
      this.allResources = resources;
      this.skillResourcesMap.clear();

      resources.forEach(resource => {
        resource.skills.forEach(skill => {
          const key = skill.name.toLowerCase();
          if (!this.skillResourcesMap.has(key)) {
            this.skillResourcesMap.set(key, []);
          }
          this.skillResourcesMap.get(key).push(resource);
        });
      });

      this.resources$.next(this.allResources);
      this.allSkills = Array.from(this.skillResourcesMap.keys());
    });

    this.form.get('selectedSkills').valueChanges.pipe(
      takeUntil(this.onDestroy$)
    ).subscribe(selectedSkills => {
      this.selectedSkills = selectedSkills;
      this.updateResources();
    });

    this.onQuery.pipe(
      withLatestFrom(merge(of(this.form.value), this.form.valueChanges)),
      mergeMap(([_, form]) => {
        this.isLoading$.next(true);
        return this.svc.queryResource(form.query).pipe(
          catchError(error => {
            console.error(error);

            let errorMessage = error;
            if (error instanceof HttpErrorResponse) {
              errorMessage = `Error [❌ ${error.status} ❌ ]\n\n${error.message}`;
            }
            this.snackBar.open(errorMessage, 'ok', { duration: 3000 });
            return of([]);
          })
        );
      }),
      tap(list => {
        this.isLoading$.next(false);
        this.resources$.next(list);
      }),
      takeUntil(this.onDestroy$)
    ).subscribe();

    // Trigger the initial query after a delay
    setTimeout(() => this.onQuery.next(), 100);
  }

  public onEditor(editor): void {
    // let line = editor.getPosition();
  }

  public remove(item: Partial<{ id: string; firstName: string; lastName: string }>): void {
    this.resources$.pipe(
      take(1),
      tap(current => this.resources$.next(current.filter(it => it.id !== item.id)))
    ).subscribe();
  }

  public doQuery(): void {
    this.onQuery.next();
  }

  public applyTmpl(t: keyof typeof TEMPLATES): void {
    this.form.patchValue({ query: TEMPLATES[t] });
  }

  private updateResources(): void {
    if (this.selectedSkills.length > 0) {
      const filteredResourcesSet = new Set<any>();

      this.selectedSkills.forEach(skill => {
        const resourcesForSkill = this.skillResourcesMap.get(skill.toLowerCase()) || [];
        resourcesForSkill.forEach(resource => filteredResourcesSet.add(resource));
      });

      this.resources$.next(Array.from(filteredResourcesSet));
      console.log(this.resources$);
    } else {
      this.resources$.next(this.allResources);
    }
  }

}
