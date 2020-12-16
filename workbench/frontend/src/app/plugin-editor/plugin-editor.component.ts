import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { BehaviorSubject, merge, Observable, Subject } from 'rxjs';
import { of } from 'rxjs';
import { takeUntil, tap, map, mergeMap, switchMap, take } from 'rxjs/operators';
import { SaveDialog } from './dialogs/save-dialog.component';
import { pluginTemplate } from './plugin-template';
import { PluginDto, PluginService } from './plugin.service';

export interface PluginEditorData {
  id: string,
  name: string;
  description: string;
  pluginCode: string;
}

const CREATE_NEW = 'create new (unsaved)';
const BUILD_IN = ['Quickest', 'Best', 'SkillsAndDistance', 'Nearest'];
const DEFAULT = { id: null, name: null, description: null, pluginCode: null };
@Component({
  selector: 'plugin-editor',
  templateUrl: './plugin-editor.component.html',
  styleUrls: ['./plugin-editor.component.scss']
})
export class PluginEditorComponent implements OnInit, OnDestroy {

  public selectList$: Observable<{ text: string, value: string }[]>;

  public saveAsCopy$: Observable<boolean>;
  public isLoading$ = new BehaviorSubject(false);
  public form: FormGroup;
  public selectedPlugin: FormControl;
  private onDistroy$ = new Subject();
  private refresh = new BehaviorSubject<boolean>(false);

  public editorOptions = {
    theme: 'vs-light',
    language: 'java'
  };

  @Output() change = new EventEmitter<PluginEditorData>();
  constructor(
    private fb: FormBuilder,
    private service: PluginService,
    public dialog: MatDialog
  ) { }

  public onEditor(editor) {
  }

  public ngOnInit(): void {

    const pluginList$ = this.refresh.pipe(
      mergeMap(() => this.service.fetchAll()),
    );

    this.selectList$ = pluginList$.pipe(
      map((list) => {
        const defaultPlugin = list.find(x => x.name === 'SkillsAndDistance') || list.find(x => !!x.defaultPlugin);
        if (defaultPlugin) {
          // select first [real] plugin 
          setTimeout(() => this.selectedPlugin.patchValue(defaultPlugin.name), 500)
        }

        return [{ text: CREATE_NEW, value: CREATE_NEW }]
          .concat(
            list
              .map(it => ({ text: it.name, value: it.name }))
              .sort((a, b) => a.value > b.value ? 0 : 1)
          )
      })
    )

    this.selectedPlugin = this.fb.control(CREATE_NEW, Validators.required);

    this.form = this.fb.group({
      id: [],
      name: [],
      description: [],
      pluginCode: [null, Validators.required],
    });

    const form$ = (merge(of(this.form.value), this.form.valueChanges) as Observable<PluginEditorData>);

    this.saveAsCopy$ = form$.pipe(map(f => BUILD_IN.includes(f.name)));

    // sync to parent
    form$
      .pipe(
        tap(value => this.change.emit(value)),
        takeUntil(this.onDistroy$)
      ).subscribe();

    // fetchPluginCode
    this.selectedPlugin.valueChanges.pipe(
      switchMap((name) => {

        if (name === CREATE_NEW) {
          this.form.patchValue(DEFAULT);
          return of(undefined);
        }

        this.isLoading$.next(true)
        return this.service.fetchByName(name).pipe(
          take(1),
          map(plugin => this.form.patchValue(plugin)),
          tap(() => this.isLoading$.next(false))
        );

      }),
      takeUntil(this.onDistroy$)
    ).subscribe();


    this.refresh.next(true);
  }

  public async delete() {
    if (this.form.invalid || !this.form.value.id) return;

    const id = this.form.value.id;
    this.selectedPlugin.patchValue(CREATE_NEW);
    this.service.delete(id)
      .pipe(take(1)).subscribe(() => {
        this.refresh.next(true);
      });

  }

  public async save() {
    if (this.form.invalid) return;

    const { pluginCode, id, name } = this.form.value;

    console.log(JSON.stringify(pluginCode))

    const work = id && name && name !== CREATE_NEW
      ? this.service.update({ id, pluginCode, name, description: name } as Partial<PluginDto>)
      : this.dialog.open(SaveDialog, { disableClose: true }).afterClosed().pipe(
        switchMap((newName: string) => {
          return this.service.create({ pluginCode, name: newName, description: newName } as Partial<PluginDto>)
        })
      );

    work.pipe(take(1)).subscribe(plugin => {
      this.refresh.next(true);
      this.form.patchValue(plugin);
      this.selectedPlugin.patchValue(plugin.name);
    });
  }

  public ngOnDestroy() {
    this.onDistroy$.next();
  }


  public newFromTemplate() {
    this.form.get('pluginCode').patchValue(pluginTemplate);
  }

}