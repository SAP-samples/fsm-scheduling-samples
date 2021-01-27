

import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ConfigService } from '../../common/services/config.service';
import { CLIENT_IDENTIFIER } from '../../common/contants';
import { GlobalContext, AuthService } from '../../common/services/auth.service';
import { ReOptimizeRequest } from '../re-optimize.component';

export type ReOptimizeReponse = { result: boolean }
export type ReOptimizeReponseWrapper = ReOptimizeReponse & {
  isError: boolean,
  errorMessage: string | null,
  time: number,
};

@Injectable({
  providedIn: 'root'
})
export class ReOptimizeService {

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

  public reOptimize(mode: 'sync' | 'async', body: ReOptimizeRequest): Observable<ReOptimizeReponseWrapper> {
    const t0 = performance.now();
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.post<ReOptimizeReponse>(`${this.config.getApiUri()}/re-optimize/actions/${mode}`, body, { headers: this.getHeaders(ctx) })),
      map(resp => {
        return {
          isError: false,
          errorMessage: null,
          time: (performance.now() - t0),
          result: resp.result
        }
      })
    );
  }

}
