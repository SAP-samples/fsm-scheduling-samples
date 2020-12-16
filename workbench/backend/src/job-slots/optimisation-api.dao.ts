import { HttpService, Injectable } from '@nestjs/common';
import { Context } from '../ctx.decorator';
import { AxiosRequestConfig, AxiosError } from 'axios';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { FSM_HOSTS_CORESUITE_TO_CORESYSTEMS } from 'src/common/constants';

export type SearchRequest = Readonly<{
  job: Readonly<{
    durationMinutes: number;
    location: Readonly<ILocation>;
    mandatorySkills: string[];
    udfValues: {
      [key: string]: string;
    }
  }>; slots: ISearchRequestSlot[];
  resources: {
    personIds: string[]
  },
  options: Readonly<{
    maxResultsPerSlot: number;
  }>;
  optimizationPlugin: null | string;
}>

type ILocation = {
  latitude: number;
  longitude: number;
}

type ISearchRequestSlot = Readonly<{
  start: string;
  end: string;
}>;

type SearchResponse = {
  results: SearchResponseItem[]
}

type SearchResponseItem = {
  slot: { start: string; end: string; },
  resource: string,
  start: string,
  end: string,
  trip: {
    durationInMinutes: number;
    distanceInMeters: number;
  }
  score: number
}

@Injectable()
export class OptimisationAPIDAO {


  private resolveHost(host: string) {
    return FSM_HOSTS_CORESUITE_TO_CORESYSTEMS.get(host.toLowerCase()) || '';
  }

  private getParams(ctx: Context) {
    return {
      companyId: ctx.companyId,
      company: ctx.company,
      accountId: ctx.accountId,
      account: ctx.account
    }
  }

  private getHeaders(ctx: Context) {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: ctx.authToken,
      'X-Request-Id': ctx.requestId,
      'X-Account-Id': ctx.accountId,
      'X-Account-Name': ctx.account,
      'X-Company-Id': ctx.companyId,
      'X-Company-Name': ctx.company,
      'X-Client-Id': ctx.clientId,
      'X-Client-Version': ctx.clientVersion,

      'companyId': ctx.companyId,
      'accountId': ctx.accountId
    };
  }

  constructor(private http: HttpService) { }

  private request<T>(config: AxiosRequestConfig) {
    const requestStart: Date = new Date();
    return this.http.request<T>(config).pipe(
      tap(response => {
        try {
          const elapsedMilliseconds: number = new Date().getTime() - requestStart.getTime();
          console.debug(
            `[OptimisationDAO:${config.method}] url: [${config.url}] response: [${JSON.stringify(response ? response.status : null)}], time: [${elapsedMilliseconds}]`,
          );
        } catch {
          console.debug(`[OptimisationDAO:${config.method}] url: [${config.url}] response[UNPROCESSIBLE]`);
        }
      }),
      catchError((error: AxiosError) => {
        console.error('OptimisationDAO', error);
        return throwError({ error });
      })
    );
  }

  public slotsSearch(ctx: Context, data: SearchRequest) {
    return this.request<SearchResponse>({
      method: 'POST',
      url: `https://${this.resolveHost(ctx.cloudHost)}/optimization/api/v2/job-slots/actions/search`,
      headers: this.getHeaders(ctx),
      params: this.getParams(ctx),
      responseType: 'json',
      data
    });
  }

}
