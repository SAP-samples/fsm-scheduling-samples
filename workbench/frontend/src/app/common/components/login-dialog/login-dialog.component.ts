import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CLIENT_IDENTIFIER, CLIENT_SECRET } from '../../contants';
import { GlobalContext } from '../../services/auth.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Selectable, SelectSheet } from '../select-sheet/select-sheet.component';

export type OauthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  account: string;
  account_id: number;
  user_id: number;
  user: string;
  user_email: string;
  companies: {
    strictEncryptionPolicy: boolean;
    name: string;
    description: string;
    id: number;
  }[];
  authorities: string[];
  cluster_url: string;
}

const NOT_SET = 'NOT_SET';

@Component({
  selector: 'login',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.scss']
})
export class LoginDialogComponent implements OnInit {
  public static CONFIG = {
    width: '450px',
    autoFocus: true,
    closeOnNavigation: false,
    hasBackdrop: true,
    disableClose: true,
    data: {}
  };

  public isLoading$ = new BehaviorSubject(false);

  public loginForm: FormGroup;

  public cloudHosts = [
    { text: 'production', value: 'ds.cloud.sap' },
    { text: 'sandbox', value: 'sb.fsm-dev.cloud.sap' },
    { text: 'ET development', value: 'et.fsm-dev.cloud.sap' },
    { text: 'QT development', value: 'qt.fsm-dev.cloud.sap' },
    { text: 'DT development', value: 'dt.fsm-dev.cloud.sap' },
  ].map(({ text, value }) => ({ value, text: `${text}` }));

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<LoginDialogComponent>,
    public sheet: MatBottomSheet,
    private snackBar: MatSnackBar,
  ) { }

  public ngOnInit() {
    this.loginForm = this.fb.group({
      user: [undefined, Validators.required],
      password: [undefined, Validators.required],
      account: [undefined, Validators.required],
      cloudHost: [this.cloudHosts[0].value, Validators.required],
      save: [true],
    });
  }

  private infoMessage(msg: string) {
    const snackBarRef = this.snackBar.open(msg, 'ok', { duration: 3000 });
    return snackBarRef;
  }

  public cancel() {
    this.dialogRef.close(null);
  }

  private selectCompany(list: Selectable[]): Observable<Selectable> {
    if (!list.length)
      throw new Error('No companies forun')

    if (list.length === 1) {
      return of(list[0]);
    }

    return this.sheet.open(SelectSheet, { data: { list, headline: 'Select Company' }, disableClose: true, hasBackdrop: true, autoFocus: true }).afterDismissed()
      .pipe(map((company: Selectable) => company));
  }

  public login() {

    if (this.loginForm.invalid) {
      return this.infoMessage('[❌ ERROR ❌] input invalid');
    }

    const { account, cloudHost, user, password, save } = this.loginForm.value;
    const basicAuth = btoa(`${CLIENT_IDENTIFIER}:${CLIENT_SECRET}`);
    const url = `https://${cloudHost}/api/oauth2/v1/token`;

    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('username', account + '/' + user)
      .set('password', password);

    this.isLoading$.next(true);

    this.http.post<OauthTokenResponse>(url, body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        Authorization: `Basic ${basicAuth}`,
        'X-Client-Id': CLIENT_IDENTIFIER,
        'X-Client-Version': '0',
        'X-Request-ID': Date.now().toString()
      }
    })
      .pipe(
        switchMap(response => this.selectCompany(response.companies).pipe(map(selectedCompany => {
          const ctx: GlobalContext = {
            authToken: `${response.token_type} ${response.access_token}`,
            cloudHost: response.cluster_url.replace('https://', '') || cloudHost,
            account: response.account,
            accountId: response.account_id,
            company: selectedCompany.name,
            companyId: selectedCompany.id as number,
            selectedLocale: 'en-us',
            user: response.user,
            userId: response.user_id
          };
          return ctx;
        }))),
      )
      .subscribe(
        ctx => {
          this.isLoading$.next(false);
          this.dialogRef.close({ ctx, save });
        },
        e => {
          this.isLoading$.next(false);
          console.error(e);
          const msg =
            e && e.error && e.error.error_description && e.error.error
              ? e.error.error + '/' + e.error.error_description
              : 'Error. Check network tab.';

          this.infoMessage('[❌ ERROR ❌ ] ' + msg);
        }
      );
  }

}
