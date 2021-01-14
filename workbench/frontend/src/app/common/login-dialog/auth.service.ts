import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { LoginDialogComponent } from './login-dialog.component';

export interface GlobalContext {
  authToken: string;
  cloudHost: string;
  account: string;
  accountId: number;
  company: string;
  companyId: number;
  selectedLocale: string;
  user: string;
  userId: number;
}

const DEFAULT_CTX = {
  authToken: 'bearer <token>',
  cloudHost: 'et.dev.coresuite.com',
  account: '<account>',
  accountId: 0,
  company: '<company>',
  companyId: 0,
  selectedLocale: 'en-us',
  user: '<user>',
  userId: 0
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private AUTH_KEY = 'playground-auth-context';
  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) { }

  public globalContext$ = new BehaviorSubject<GlobalContext>(DEFAULT_CTX);
  public globalContextWithAuth$ = this.globalContext$.pipe(filter((it) => it !== DEFAULT_CTX));
  public isLoggedIn$ = this.globalContext$.pipe(map(it => it !== DEFAULT_CTX))

  public logout() {
    this.clearContext();
    this.onContextReady(DEFAULT_CTX);
  }

  public openLoginDialog() {
    const dialogRef = this.dialog.open(LoginDialogComponent,
      LoginDialogComponent.CONFIG
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      const { ctx, save } = result;
      this.onContextReady(ctx);
      if (save) {
        this.storeContext(ctx);
      }
    });
  }

  public tryRestoreSession() {
    const ctx = this.restoreContext();
    if (ctx) {
      this.infoMessage(
        '[✅ INFO ✅] session loaded from sessionStorage',
        'logout', () => this.logout()
      );
      setTimeout(() => this.onContextReady(ctx), 1)
    } else {
      this.infoMessage(
        '[❌ WARN ❌ ] no session found',
        'login', () => this.openLoginDialog()
      );
      this.openLoginDialog();
    }
  }

  private onContextReady(ctx: GlobalContext) {
    this.globalContext$.next(ctx);
  }

  private clearContext() {
    this.infoMessage('[✅ INFO ✅] session cleared from sessionStorage', 'login', () => this.openLoginDialog());
    sessionStorage.removeItem(this.AUTH_KEY);
  }

  private storeContext(ctx: GlobalContext) {
    this.infoMessage('[✅ INFO ✅] session stored in sessionStorage');
    sessionStorage.setItem(this.AUTH_KEY, JSON.stringify(ctx))
  }

  private restoreContext(): GlobalContext | null {
    const ctx = sessionStorage.getItem(this.AUTH_KEY);
    return ctx
      ? JSON.parse(ctx)
      : null;
  }

  private infoMessage(msg: string, btnText = 'ok', action: () => void | null = null) {
    const snackBarRef = this.snackBar.open(msg, btnText, { duration: 5000 });
    if (action) {
      snackBarRef.onAction().subscribe(() => {
        action();
        snackBarRef.dismiss();
      });
    }
  }
}
