import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { mergeMap, tap } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { CLIENT_IDENTIFIER } from '../contants';
import { GlobalContext, AuthService } from './auth.service';

type PersonObj = { id: string, firstName: string, lastName: string };
type ActivityObj = { id: string, subject: string };

type InternalCache = {
  resource: Map<string, PersonObj>;
  activity: Map<string, ActivityObj>;
}

@Injectable({
  providedIn: 'root'
})
export class QueryService {

  private __cache: InternalCache = {
    resource: new Map<string, PersonObj>(),
    activity: new Map<string, ActivityObj>()
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

  private addToCache(key: keyof InternalCache, list: Partial<PersonObj>[] | Partial<ActivityObj>[]) {
    if (Array.isArray(list)) {
      list.forEach(item => {
        if (key === 'resource' && item && item.id && !this.getCache(key).has(item.id)) {
          this.getCache(key).set(item.id, { id: item.id, firstName: (item.firstName || ''), lastName: (item.lastName || '') })
        }
      })
    }
  }

  private _query<T_LIST extends T_ITEM[], T_ITEM extends {}>(key: keyof InternalCache, query: string) {
    console.log(query);
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.post<T_LIST>(`${this.config.getApiUri()}/query`, { query }, { headers: this.getHeaders(ctx) })),
      tap((list) => this.addToCache(key, list))
    );
  }

  public queryActivities<list extends item[], item extends ActivityObj>(query: string) {
    return this._query<list, item>('activity', query);
  }

  public queryResource<list extends item[], item extends PersonObj>(query: string) {
    return this._query<list, item>('resource', query);
  }

  public getResourceFromCache(id: string): PersonObj {
    return this.getCache('resource').has(id)
      ? this.getCache('resource').get(id)
      : { id, firstName: 'N/A', lastName: 'N/A' };
  }

  public static toLastChangedDateStringFormat = (lastChanged: number): string => {
    // ¯\_(ツ)_/¯ queryApi only supports only dateTime on [lastChanged]
    // but only formats suppored are:
    // [yyyy-MM-ddThh:mm:ssZ]
    // [yyyy-MM-dd hh:mm:ss.SSS]
    // ISO:
    // [yyyy-MM-ddThh:mm:ss.SSSZ] is NOT suppored
    const lastChangedDateString = new Date(lastChanged)
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '');

    return lastChangedDateString;
  };

  public static trimMilliseconds = (dateString: string) => {
    // ¯\_(ツ)_/¯ queryApi and dates ...
    // ISO: [yyyy-MM-ddThh:mm:ss.SSSZ] is NOT suppored
    // but 
    // [yyyy-MM-ddThh:mm:ssZ] 
    return new Date(new Date(dateString).setMilliseconds(0)).toISOString().replace('.000', '');
  }
}
