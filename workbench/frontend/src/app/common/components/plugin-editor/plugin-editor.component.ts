import { AfterContentInit, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { EditorComponent } from 'ngx-monaco-editor';
import { BehaviorSubject, merge, Observable, of, Subject } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { SaveDialog } from './save-dialog/save-dialog.component';
import { pluginTemplate } from './plugin-template';
import { PluginDto, PluginService, PolicyObjectiveDto } from '../../services/plugin.service';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';

export interface PluginEditorData {
  id: string;
  name: string;
  description: string;
  objective: PolicyObjectiveDto;
  pluginCode: string;
}

// const CREATE_NEW = 'Select a plugin';
const BUILD_IN = ['Quickest', 'Best', 'SkillsAndDistance', 'Nearest'];
// const DEFAULT: PluginEditorData = { id: null, name: null, description: null, pluginCode: null };
const DEFAULT_BUILD_IN = 'DistanceAndSkills';
@Component({
  selector: 'plugin-editor',
  templateUrl: './plugin-editor.component.html',
  styleUrls: ['./plugin-editor.component.scss']
})
export class PluginEditorComponent implements OnInit, OnDestroy, AfterContentInit {

  public selectList$: Observable<{ text: string, value: string }[]>;

  public saveAsCopy$: Observable<boolean>;
  public isLoading$ = new BehaviorSubject(false);
  public form: FormGroup;
  public selectedPlugin: FormControl;
  public disableEditor$ = new BehaviorSubject<boolean>(false);
  private onDestroy$ = new Subject();
  private refresh = new BehaviorSubject<boolean>(false);

  public editorOptions = {
    theme: 'vs-light',
    language: 'java'
  };

  @Output() changePlugin = new EventEmitter<string>();
  @ViewChild('editorInstance') editorInstance: EditorComponent;

  constructor(
    private fb: FormBuilder,
    private service: PluginService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) { }

  private infoMessage(msg: string): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(msg, 'ok', { duration: 3000 });
  }

  public onEditorInit(editor): void {
    // how to key bind
    // https://microsoft.github.io/monaco-editor/playground.html#interacting-with-the-editor-adding-an-action-to-an-editor-instance
    editor.addAction({
      id: 'cmd+s-to-save',
      label: 'Save (cmd+s)',
      keybindings: [
        monaco.KeyMod.CtrlCmd || monaco.KeyCode.KEY_S,
      ],
      precondition: null,
      keybindingContext: null,
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: _ed => {
        if (this.form.invalid) {
          return null;
        }
        this.save();
        return null;
      }
    });
  }

  public ngAfterContentInit(): void {
    this.disableEditor$.pipe(
      filter((value) => this.editorInstance && value === true),
      tap((value) => this.editorInstance.options = { ...this.editorInstance.options, readOnly: true }),
      takeUntil(this.onDestroy$)
    ).subscribe();
  }

  public ngOnInit(): void {

    const pluginList$ = this.refresh.pipe(
      mergeMap(() => this.service.fetchAll()),
      catchError((error) => {
        // if fetch all fails lets disable editor
        console.error(error);
        this.infoMessage(`[❌ ERROR ❌] 'could not read plugins, disabled editor'`);
        this.disableEditor$.next(true);
        return of([] as PluginDto[]);
      })
    );

    this.selectList$ = pluginList$.pipe(
      map((list) => {
        const defaultPlugin = list.find(x => x.name === DEFAULT_BUILD_IN) || list.find(x => !!x.defaultPlugin);
        if (defaultPlugin) {
          // select first [real] plugin
          setTimeout(() => this.selectedPlugin.patchValue(defaultPlugin.name), 500);
        }

        return [/*{ text: CREATE_NEW, value: CREATE_NEW }*/]
          .concat(
            list
              .map(it => ({ text: it.name, value: it.name }))
              .sort((a, b) => a.value > b.value ? 0 : 1)
          );
      })
    );

    this.selectedPlugin = this.fb.control('' /*CREATE_NEW*/, Validators.required);

    this.form = this.fb.group({
      id: [],
      name: [],
      description: [],
      objective: [],
      pluginCode: [null, Validators.required],
    });

    const form$ = (merge(of(this.form.value), this.form.valueChanges) as Observable<PluginEditorData>);

    this.saveAsCopy$ = form$.pipe(map(f => BUILD_IN.includes(f.name)));

    // sync to parent
    form$
      .pipe(
        tap(value => this.changePlugin.emit(value.name || DEFAULT_BUILD_IN)),
        takeUntil(this.onDestroy$)
      ).subscribe();


    // fetchPluginCode
    this.selectedPlugin.valueChanges.pipe(
      switchMap((name) => {

        /*if (name === CREATE_NEW) {
          this.form.patchValue(DEFAULT);
          return of(undefined);
        }*/

        this.isLoading$.next(true);
        return this.service.fetchByName(name).pipe(
          take(1),
          map(plugin => this.form.patchValue(plugin)),
          tap(() => this.isLoading$.next(false)),
          tap(() =>     console.log(this.form.value))
        );
      }),
      takeUntil(this.onDestroy$)).subscribe();


    this.refresh.next(true);
  }

  public ngOnDestroy(): void {
    this.onDestroy$.next();
  }

  public async delete(): Promise<void> {
    if (this.form.invalid || !this.form.value.id) { return; }

    const id = this.form.value.id;
    // this.selectedPlugin.patchValue(CREATE_NEW);
    this.service.delete(id).pipe(take(1)).subscribe(
      () => {
        this.refresh.next(true);
      },
      error => {
        this.isLoading$.next(false);
        console.error(error);
        this.infoMessage(`[❌ ERROR ❌] ${error.message}`);
      }
    );
  }

  public async save(): Promise<void> {
    if (this.form.invalid) { return; }
    const { pluginCode, id, name, description } = this.form.value;


    this.isLoading$.next(true);

    const work = id && name /*&& name !== CREATE_NEW*/
      ? this.service.update({ id, pluginCode, name, description } as Partial<PluginDto>)
      : this.dialog.open(SaveDialog, { disableClose: true }).afterClosed().pipe(
        switchMap((newName: string) => {
          return this.service.create({ pluginCode, name: newName, description: '1.0.0' } as Partial<PluginDto>);
        })
      );

    work.pipe(take(1)).subscribe(
      plugin => {
        this.isLoading$.next(false);
        this.refresh.next(true);
        this.form.patchValue(plugin);
        this.selectedPlugin.patchValue(plugin.name);
      },
      error => {
        this.isLoading$.next(false);
        console.error(error);
        this.infoMessage(`[❌ ERROR ❌] ${error.message}`);
      }
    );
  }

  public createNewFromTemplate(): void {
    this.form.get('pluginCode').patchValue(pluginTemplate);
  }

}
