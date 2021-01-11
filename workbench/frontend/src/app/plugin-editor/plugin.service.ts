import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { catchError, mergeMap, retry, tap } from 'rxjs/operators';
import { ConfigService } from '../common/config.service';
import { CLIENT_IDENTIFIER } from '../common/contants';
import { AuthService, GlobalContext } from '../common/login-dialog/auth.service';

export type PluginDto = {
  id: string,
  name: string;
  description: string;
  defaultPlugin: boolean;
  pluginCode?: string;
  scheduleConfigId?: string;
}


@Injectable({
  providedIn: 'root'
})
export class PluginService {

  private getHeaders(ctx: GlobalContext) {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `${ctx.authToken}`,
      'x-cloud-host': `${ctx.cloudHost}`,
      'x-account-name': `${ctx.account}`,
      'x-account-id': `${ctx.accountId}`,
      'x-company-name': `${ctx.company}`,
      'x-company-id': `${ctx.companyId}`,
      'x-user-name': `${ctx.user}`,
      'x-user-id': `${ctx.userId}`,
      'x-client-id': CLIENT_IDENTIFIER,
      'x-client-version': '0.0.0',
      'x-request-id': `${Date.now()}`,
    })
  }

  constructor(
    private config: ConfigService,
    private auth: AuthService,
    private http: HttpClient,
  ) {

  }

  fetchAll() {
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.get<PluginDto[]>(`${this.config.getApiUri()}/plugin`, { headers: this.getHeaders(ctx) })),
    );
  }

  fetchById(id: string) {
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.get<PluginDto>(`${this.config.getApiUri()}/plugin/by-id/${id}`, { headers: this.getHeaders(ctx) }))
    );
  }

  fetchByName(name: string) {
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.get<PluginDto>(`${this.config.getApiUri()}/plugin/by-name/${name}`, { headers: this.getHeaders(ctx) }))
    );
  }

  create(plugin: Partial<PluginDto>) {
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.post<PluginDto>(`${this.config.getApiUri()}/plugin`, plugin, { headers: this.getHeaders(ctx) })),
      catchError(e => {

        // why????
        if (e instanceof HttpErrorResponse && e.status === 201) {
          return of(plugin);
        }

        return throwError({ error: e })
      })
    );
  }

  update(plugin: Partial<PluginDto>) {
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.put<PluginDto>(`${this.config.getApiUri()}/plugin/${plugin.id}`, plugin, { headers: this.getHeaders(ctx) }))
    );
  }

  delete(pluginId: string) {
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.delete<PluginDto>(`${this.config.getApiUri()}/plugin/${pluginId}`, { headers: this.getHeaders(ctx) }))
    );
  }
}
