import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { CLIENT_IDENTIFIER } from '../contants';
import { AuthService, GlobalContext } from './auth.service';

export type TechnicianDTO = {
  id: string,
  name: string;
  description: string;
  defaultPlugin: boolean;
  standardPlugin: boolean;
  pluginCode: string;
  scheduleConfigId: string;
};

export type AGHResponseDTO = { // TODO there are other DTOs using results: Array pattern, maybe merge as generic and reuse
  results: TechnicianDTO[]
};

export type AGHRequestDTO = {
  companyNames: string[],
  options: {
    geocodedOnly: boolean,
    includeInternalPersons: boolean,
    includeCrowdPersons: boolean
  },
  bookingsFilter: Partial<{
    earliest: string,
    latest: string,
    activitiesToExclude: string[],
    considerReleasedAsExclusive: boolean,
    considerPlannedAsExclusive: boolean
  }>,
  personIds: string[]
};

@Injectable({
  providedIn: 'root'
})
export class TechnicianService {

  private getHeaders(ctx: GlobalContext): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `${ctx.authToken}`,
      'x-cloud-host': `${ctx.cloudHost}`,
      'x-account-name': `${ctx.account}`,
      'x-account-id': `${ctx.accountId}`,
      'x-company-name': `${ctx.company}`,
      'x-company-id': `${ctx.companyId}`,
      'x-user-name': `${ctx.user}`,
      'x-user-id': `${ctx.userId}`,
      'x-client-id': CLIENT_IDENTIFIER,
      'x-client-version': '0.0.0',
      'x-request-id': `${Date.now()}`
    });
  }

  constructor(
    private config: ConfigService,
    private auth: AuthService,
    private http: HttpClient
  ) {
  }


  fetchAll(body: Partial<AGHRequestDTO>): Observable<AGHResponseDTO> {
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx =>
        this.http.post<AGHResponseDTO>(`${this.config.getApiUri()}/technicians`,
          body, { headers: this.getHeaders(ctx) }))
    );
  }
}
