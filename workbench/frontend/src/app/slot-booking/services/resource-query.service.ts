import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { mergeMap, tap } from 'rxjs/operators';
import { ConfigService } from '../../common/config.service';
import { CLIENT_IDENTIFIER } from '../../common/contants';
import { GlobalContext, AuthService } from '../../common/login-dialog/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ResourceQueryService {

  private resourceCache = new Map<string, { id: string, firstName: string, lastName: string }>();


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

  query<T>(query: string) {
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.post<T[]>(`${this.config.getApiUri()}/query`, { query }, { headers: this.getHeaders(ctx) })),
      tap((list: Partial<{ id: string; firstName: string, lastName: string }>[]) => {
        if (Array.isArray(list)) {
          list.forEach(item => {
            if (item && item.id && !this.resourceCache.has(item.id)) {
              this.resourceCache.set(item.id, { id: item.id, firstName: (item.firstName || ''), lastName: (item.lastName || '') })
            }
          })
        }
      })
    );
  }

  public resourceFromCache(id: string): { id: string, firstName: string, lastName: string } {
    return this.resourceCache.has(id) ? this.resourceCache.get(id) : { id, firstName: 'N/A', lastName: 'N/A' };
  }

}
