import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { GlobalContext, AuthService } from './common/login-dialog/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'FSM AI';

  ctx$: Observable<GlobalContext>;
  isLoggedIn$: Observable<boolean>;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(
    private breakpointObserver: BreakpointObserver,
    private auth: AuthService
  ) {
  }

  public ngOnInit() {
    this.ctx$ = this.auth.globalContext$;
    this.isLoggedIn$ = this.auth.isLoggedIn$;
    this.auth.tryRestoreSession();
  }

  public async logout() {
    this.auth.logout();
  }

  public async login() {
    this.auth.openLoginDialog();
  }

}