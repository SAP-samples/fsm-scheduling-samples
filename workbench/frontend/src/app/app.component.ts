import { Component, OnInit, Renderer2, Inject, AfterViewInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { GlobalContext, AuthService } from './common/services/auth.service';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
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
    private auth: AuthService,
    private _renderer2: Renderer2,
    @Inject(DOCUMENT) private _document: Document
  ) {
  }

  public ngOnInit(): void {
    this.ctx$ = this.auth.globalContext$;
    this.isLoggedIn$ = this.auth.isLoggedIn$;
    this.auth.tryRestoreSession();
  }

  public ngAfterViewInit(): void {
    const script = this._renderer2.createElement('script');
    script.src = 'https://main-11lv1sn8.eu12.sapdas-staging.cloud.sap/resources/public/webclient/bootstrap.js';
    script.setAttribute('data-bot-name', 'plugins');
    script.setAttribute('data-expander-type', 'DEFAULT');
    script.setAttribute('data-expander-preferences', 'JTdCJTIyYWNjZW50Q29sb3IlMjIlM0ElMjIlMjNFMDVBNDclMjIlMkMlMjJiYWNrZ3JvdW5kQ29sb3IlMjIlM0ElMjIlMjNGRkZGRkYlMjIlMkMlMjJjb21wbGVtZW50YXJ5Q29sb3IlMjIlM0ElMjIlMjNGRkZGRkYlMjIlMkMlMjJvbmJvYXJkaW5nTWVzc2FnZSUyMiUzQSUyMkNvbWUlMjBzcGVhayUyMHRvJTIwbWUhJTIyJTJDJTIyZXhwYW5kZXJUaXRsZSUyMiUzQSUyMiUyMiUyQyUyMmV4cGFuZGVyTG9nbyUyMiUzQSUyMkNVWF9BdmF0YXIuc3ZnJTIyJTJDJTIydGhlbWUlMjIlM0ElMjJzYXBfaG9yaXpvbiUyMiU3RA==');

    this._renderer2.appendChild(this._document.head, script);
  }

  public async logout(): Promise<void> {
    this.auth.logout();
  }

  public async login(): Promise<void> {
    this.auth.openLoginDialog();
  }

}
