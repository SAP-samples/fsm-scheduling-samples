import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { mergeMap, tap } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { CLIENT_IDENTIFIER } from '../contants';
import { GlobalContext, AuthService } from './auth.service';

type PersonObj = { id: string, firstName: string, lastName: string };

type InternalCache = {
  resource: Map<string, PersonObj>
}

@Injectable({
  providedIn: 'root'
})
export class QueryService {

  private __cache: InternalCache = {
    resource: new Map<string, PersonObj>()
  }

  private getCache<T extends Map<string, any>>(key: keyof InternalCache) {
    return this.__cache[key] as T;
  }

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
  ) { }

  private addToCache(key: keyof InternalCache, list: Partial<PersonObj>[]) {
    if (Array.isArray(list)) {
      list.forEach(item => {

        if (key === 'resource' && item && item.id && !this.getCache(key).has(item.id)) {
          this.getCache(key).set(item.id, { id: item.id, firstName: (item.firstName || ''), lastName: (item.lastName || '') })
        }

      })
    }
  }

  private _query<T_LIST extends T_ITEM[], T_ITEM extends {}>(key: keyof InternalCache, query: string) {

    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.post<T_LIST>(`${this.config.getApiUri()}/query`, { query }, { headers: this.getHeaders(ctx) })),
      tap((list) => this.addToCache(key, list))
    );
  }

  public queryResource<list extends item[], item extends { id: string, firstName: string, lastName: string }>(query: string) {
    return this._query<list, item>('resource', query);
  }

  public getResourceFromCache(id: string): { id: string, firstName: string, lastName: string } {
    return this.getCache('resource').has(id)
      ? this.getCache('resource').get(id)
      : { id, firstName: 'N/A', lastName: 'N/A' };
  }
}
