import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, merge, of, Subject } from 'rxjs';
import { catchError, map, mergeMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { QueryService } from '../../services/query.service';
import { SharedSkillsService } from '../../services/shared-skill.service';

const TEMPLATES = {
  default: `
    SELECT resource.id        as id,
           resource.firstName as firstName,
           resource.lastName  as lastName
    FROM UnifiedPerson resource
    WHERE resource.plannableResource = true
      AND resource.inactive != true
    LIMIT 25
  `,
  skill: `
    SELECT resource.id        as id,
           resource.firstName as firstName,
           resource.lastName  as lastName
    FROM Tag tag
           LEFT JOIN Skill skill ON skill.tag = tag.id
           LEFT JOIN UnifiedPerson resource ON resource.id = skill.person
    WHERE resource.plannableResource = true
      AND resource.inactive != true
      AND tag.name = '<insert-skill-here>'
    LIMIT 25
  `,
  region: `
    SELECT resource.id        as id,
           resource.firstName as firstName,
           resource.lastName  as lastName
    FROM UnifiedPerson resource
           LEFT JOIN Region region ON region.name = '<insert-region-here>'
    WHERE region.id IN resource.regions
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
  public skillResourcesMap: Map<string, Set<any>> = new Map();
  public allResources: any[] = [];
  public selectedSkills$ = new BehaviorSubject<string[]>([]);

  public selectedTemplate = 'default';
  public crowdChecked = false;
  public internalChecked = false;


  @Input() selectedMandatorySkills: string[];
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
    private sharedSkillsService: SharedSkillsService
  ) {
  }

  public ngOnDestroy(): void {
    this.onDestroy$.next();
  }

  public ngOnInit(): void {
    this.form = this.fb.group({
      query: [TEMPLATES.default],
    });

    this.svc.queryResourceSkills(TEMPLATES.default).subscribe(resources => {
      this.allResources = resources;
      this.skillResourcesMap.clear();

      resources.forEach(resource => {
        resource.skills.forEach(skill => {
          const key = skill.name.toLowerCase();
          if (!this.skillResourcesMap.has(key)) {
            this.skillResourcesMap.set(key, new Set());
          }
          this.skillResourcesMap.get(key).add(resource);
        });
      });

      this.resources$.next(this.allResources);
      this.allSkills = Array.from(this.skillResourcesMap.keys());
    });

    this.selectedSkills$ = this.sharedSkillsService.selectedSkills$;

    this.sharedSkillsService.selectedSkills$.subscribe((selectedSkills) => {
      this.updateResources(selectedSkills);
    });

    this.onQuery.pipe(
      withLatestFrom(merge(of(this.form.value), this.form.valueChanges)),
      mergeMap(([_, form]) => {
        this.isLoading$.next(true);
        return this.svc.queryResourceSkills(form.query).pipe(
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

    setTimeout(() => this.onQuery.next(), 100);

    this.resources$.pipe(
      tap(list => {
        if (list.length) {
          this.change.next(list.map(it => it.id));
        }
      }),
      takeUntil(this.onDestroy$)
    ).subscribe();
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


  public removeSkill(skill: string): void {
    this.sharedSkillsService.selectedSkills$.pipe(
      take(1),
      map((selectedSkills) => selectedSkills.filter((s) => s !== skill))
    ).subscribe((updatedSkills) => {
      this.selectedSkills$.next(updatedSkills);
    });
    this.selectedSkills$ = this.sharedSkillsService.selectedSkills$;
  }

  public doQuery(): void {
    this.onQuery.next();
  }

  public applyTmpl(t: keyof typeof TEMPLATES): void {
    this.selectedTemplate = t;
    this.form.patchValue({ query: TEMPLATES[t] });
    this.updateSqlCode();
  }

  private updateResources(skills): void {
    if (skills.length > 0) {
      const firstSkill = skills[0];
      const firstResourceSet = this.skillResourcesMap.get(firstSkill.toLowerCase()) || new Set();

      const intersection = skills.slice(1).reduce((commonResources, skill) => {
        const resourceSet = this.skillResourcesMap.get(skill.toLowerCase()) || new Set();
        return new Set([...commonResources].filter(resource => resourceSet.has(resource)));
      }, firstResourceSet);

      this.resources$.next(Array.from(intersection));
    } else {
      this.resources$.next(this.allResources);
    }
  }


  public switchCrowdInternal(changed: string): void {
    if (changed === 'CROWD' && this.crowdChecked) {
      this.internalChecked = false;
    }
    else if (changed === 'INTERNAL' && this.internalChecked) {
      this.crowdChecked = false;
    }

    this.updateSqlCode();
  }

  public updateSqlCode(): void {
    const updateCondition = (conditionToAdd: string, include: boolean): void => {
      const query = this.form.value.query;

      if (query.trim() !== '') {
        if (include) {
          const updatedQuery = this.insertTextAfterWhere(query, conditionToAdd);
          this.form.patchValue({ query: updatedQuery });
        } else {
          const modifiedQuery = this.removeCondition(query, conditionToAdd);
          this.form.patchValue({ query: modifiedQuery });
        }
      }
    };

    updateCondition('resource.crowdType LIKE \'CROWD\'\n\tAND ', this.crowdChecked);
    updateCondition('resource.crowdType LIKE \'NON_CROWD\'\n\tAND ', this.internalChecked);
  }

  private insertTextAfterWhere(input: string, newText: string): string {
    const whereRegex = /\bWHERE\b/i;
    const whereMatch = whereRegex.exec(input);

    if (whereMatch) {
      const insertionIndex = whereMatch.index + whereMatch[0].length;

      return `${input.slice(0, insertionIndex)} ${newText}${input.slice(insertionIndex)}`;
    } else {
      return `${input}\n${newText}`;
    }
  }

  private removeCondition(query: string, conditionToRemove: string): string {
    return query.replace(conditionToRemove, '');
  }
}
