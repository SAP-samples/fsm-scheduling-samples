import { AfterContentInit, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { BehaviorSubject, Observable, Subject, combineLatest, merge, of } from 'rxjs';
import { JobService, TagDTO, Job } from '../../services/job.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { filter, map, take, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'job-builder',
  templateUrl: './job-builder.component.html',
  styleUrls: ['./job-builder.component.scss']
})
export class JobBuilderComponent implements OnInit, OnDestroy, AfterContentInit {

  public separatorKeysCodes: number[] = [ENTER, COMMA];
  public mandatorySkillsCtrl = new FormControl();
  public optionalSkillsCtrl = new FormControl();
  public filteredTags$: Observable<TagDTO[]>;
  public matchingResourceCount$: Observable<number>;
  public matchingResources$: Observable<string[]>;
  public selectedMandatorySkills$ = new BehaviorSubject<string[]>([]);
  public selectedOptionalSkills$ = new BehaviorSubject<string[]>([]);
  public allAddress$: Observable<{ text: string, location: { latitude: number, longitude: number } }[]>;
  public removable = true;
  public durationList = [.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 16, 24, 36, 48, 78].map(n => (n * 60));
  public drawToMap$: Observable<{ latitude: number; longitude: number; }>;
  public isPicking$ = new BehaviorSubject(false);

  @ViewChild('mandatorySkillsInput') mandatorySkillsInput: ElementRef<HTMLInputElement>;
  @ViewChild('optionalSkillsInput') optionalSkillsInput: ElementRef<HTMLInputElement>;
  @Output() change = new EventEmitter<Job>();
  form: FormGroup;
  selectedAddress: FormControl;

  onDistroy$ = new Subject();

  constructor(
    private fb: FormBuilder,
    private service: JobService,
  ) { }

  public ngAfterContentInit() {

  }

  public ngOnInit(): void {

    this.selectedAddress = this.fb.control(null);
    this.selectedAddress.valueChanges.pipe(
      filter(x => !!x),
      tap((item: { location: { latitude: number; longitude: number; } }) => {
        this.form.patchValue({
          location_latitude: item.location.latitude,
          location_longitude: item.location.longitude
        })
        this.selectedAddress.patchValue(null);
      }),
      takeUntil(this.onDistroy$)
    ).subscribe();

    this.allAddress$ = this.service.fetchAllAddress().pipe(
      // must have lat/log
      map(list => list.filter(it => !!it.location && it.location.longitude && it.location.latitude)
        .map(it => ({
          text: [`[${it.type}]`, it.street, it.streetNo, it.city].filter(x => !!x).map(x => x.trim()).join(' '),
          location: it.location
        })).sort((a, b) => a.text > b.text ? 1 : -1)
      )
    );

    const alltags = this.service.fetchAllTags()


    alltags.pipe(
      take(1),
      tap(all => {
        setTimeout(() => {
          const [first] = all.sort((a, b) => b.persons.length - a.persons.length);
          if (first) {
            // select mandatory skill
            // this.selectedMandatorySkills$.next([first.name]);
          }
        }, 100)
      })
    ).subscribe()

    this.matchingResources$ = combineLatest([this.selectedMandatorySkills$, alltags]).pipe(
      map(([selected, all]) => selected.map(tagName => all.find(x => x.name === tagName))
        .filter(it => !!it)
        .reduce((theSet, it) => {
          it.persons.forEach(p => theSet.add(p))
          return theSet;
        }, new Set<string>())),
      map((theSet) => Array.from(theSet)),
    );

    this.matchingResourceCount$ = this.matchingResources$.pipe(
      map(list => list.length === 0 ? Infinity : list.length)
    );

    this.filteredTags$ = combineLatest([this.selectedMandatorySkills$, alltags]).pipe(
      map(([selected, all]) => all.filter(tag => !selected.some(x => x === tag.name)))
    );

    this.form = this.fb.group({
      durationMinutes: [(4 * 60), Validators.required],
      location_latitude: [52.5158595, Validators.required],
      location_longitude: [13.3175292, Validators.required],
      mandatorySkills: [[], Validators.required],
      optionalSkills: [[], Validators.nullValidator]
    });

    this.selectedMandatorySkills$.pipe(
      tap((list) => this.form.patchValue({ mandatorySkills: list })),
      takeUntil(this.onDistroy$)
    ).subscribe();

    this.selectedOptionalSkills$.pipe(
      tap((list) => this.form.patchValue({ optionalSkills: list })),
      takeUntil(this.onDistroy$)
    ).subscribe();

    const form$ = merge(of(this.form.value), this.form.valueChanges);
    this.drawToMap$ = form$.pipe(
      map((form) => ({ latitude: form.location_latitude, longitude: form.location_longitude }))
    );

    form$.pipe(
      tap(value => {
        const { durationMinutes, mandatorySkills, optionalSkills, location_latitude, location_longitude } = value;
        const job: Job = {
          durationMinutes,
          mandatorySkills,
          optionalSkills,
          location: location_latitude && location_longitude
            ? { latitude: location_latitude, longitude: location_longitude }
            : null
        };
        this.change.next(job);
      }),
      takeUntil(this.onDistroy$)
    ).subscribe();
  }

  public ngOnDestroy() {
    this.onDistroy$.next();
  }

  public mandatorySkillsSelectionChanged(event: MatAutocompleteSelectedEvent) {
    this.selectedMandatorySkills$.next([...this.selectedMandatorySkills$.value, event.option.value]);
    this.mandatorySkillsInput.nativeElement.value = '';
    this.mandatorySkillsCtrl.setValue(null);
  }

  public addMandatorySkill(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;
    if (!value) return;

    this.selectedMandatorySkills$.next([...this.selectedMandatorySkills$.value, value.trim()]);
    if (input) {
      input.value = '';
    }
  }

  public removeMandatorySkill(tagName: string) {
    this.selectedMandatorySkills$.next(this.selectedMandatorySkills$.value.filter(it => (it !== tagName)));
  }

  public optionalSkillsSelectionChanged(event: MatAutocompleteSelectedEvent) {
    this.selectedOptionalSkills$.next([...this.selectedOptionalSkills$.value, event.option.value]);
    this.optionalSkillsInput.nativeElement.value = '';
    this.optionalSkillsCtrl.setValue(null);
  }

  public addOptionalSkill(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;
    if (!value) return;

    this.selectedOptionalSkills$.next([...this.selectedOptionalSkills$.value, value.trim()]);
    if (input) {
      input.value = '';
    }
  }

  public removeOptionalSkill(tagName: string) {
    this.selectedOptionalSkills$.next(this.selectedOptionalSkills$.value.filter(it => (it !== tagName)));
  }

  public locationClear() {
    this.selectedAddress.patchValue(null)
    this.form.patchValue({
      location_latitude: null,
      location_longitude: null
    });
  }

  public pickFromMap() {
    this.isPicking$.next(true);
  }

  public mapSelect({ latitude, longitude }: { latitude: number; longitude: number; }) {
    if (this.isPicking$.value) {
      this.form.patchValue({
        location_latitude: latitude,
        location_longitude: longitude
      });
      this.isPicking$.next(false);
    }
  }

}
