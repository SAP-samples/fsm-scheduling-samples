import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { CLIENT_IDENTIFIER, CLIENT_SECRET } from '../contants';
import { GlobalContext } from './auth.service';


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
    { text: 'PRODUCTION', value: 'ds.coresuite.com' },
    { text: 'SANDBOX', value: 'sb.dev.coresuite.com' },
    { text: 'DEV ET', value: 'et.dev.coresuite.com' },
    { text: 'DEV QT', value: 'qt.dev.coresuite.com' },
    { text: 'DEV DT', value: 'dt.dev.coresuite.com' },
  ].map(({ text, value }) => ({ value, text: `${text} (${value})` }))

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<LoginDialogComponent>,
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

  public login() {

    if (this.loginForm.invalid) {
      return this.infoMessage('[ERROR] mäh ... fill form');
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
        'X-Request-ID': '1'
      }
    })
      .subscribe(
        response => {

          this.isLoading$.next(false);

          const selectedCompany: { name: string; id: number } = response.companies.length
            ? response.companies.map(({ id, name }) => ({ name, id }))[0]
            : { name: NOT_SET, id: -1 };

          const ctx: GlobalContext = {
            authToken: `${response.token_type} ${response.access_token}`,
            cloudHost: cloudHost,
            account: response.account,
            accountId: response.account_id,
            company: selectedCompany.name,
            companyId: selectedCompany.id,
            selectedLocale: 'en-us',
            user: response.user,
            userId: response.user_id
          }

          this.dialogRef.close({ ctx, save });
        },
        e => {
          this.isLoading$.next(false);
          const msg =
            e && e.error && e.error.error_description && e.error.error
              ? e.error.error + '/' + e.error.error_description
              : 'Error. Check network tab.';

          this.infoMessage('[ERROR] ' + msg);
        }
      );
  }

}