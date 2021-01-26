import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ConfigService } from '../../common/services/config.service';
import { CLIENT_IDENTIFIER } from '../../common/contants';
import { GlobalContext, AuthService } from '../../common/services/auth.service';
import { ResourceQueryService } from '../../common/services/resource-query.service';

export type GroupedSearchResponse = {
  items: SearchResponseItem[],
  slot: {
    start: string;
    end: string;
  },
  hash: string,
  maxScore: number,
  sumScore: number
}

export type SearchResponseWrapper = SearchResponse & {
  isError: boolean,
  errorMessage: string | null,
  time: number,
  grouped: GroupedSearchResponse[]
};

type SearchResponseItemExteded = SearchResponseItem & { resourceVm: { id: string, firstName: string, lastName: string } | undefined | null }

export type SearchResponseItem = {
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
type SearchResponse = {
  results: SearchResponseItem[]
}
type ISearchRequestSlot = Readonly<{
  start: string;
  end: string;
}>;

export type SearchRequest = Readonly<{
  job: Readonly<{
    durationMinutes: number;
    location: Readonly<ILocation>;
    mandatorySkills: string[];
    udfValues: {
      [key: string]: string;
    }
  }>;
  slots: ISearchRequestSlot[];
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


@Injectable({
  providedIn: 'root'
})
export class SlotSearchService {

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
    private queryService: ResourceQueryService
  ) {
  }

  public doRequest(body: SearchRequest): Observable<SearchResponseWrapper> {
    const t0 = performance.now();


    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.post<SearchResponse>(`${this.config.getApiUri()}/job-slots/actions/search`, body, { headers: this.getHeaders(ctx) })),
      map(resp => {
        return {
          ...resp,
          errorMessage: null,
          isError: false,
          time: (performance.now() - t0),
          grouped: Array.from(resp.results.reduce((theMap, it) => {

            const hash = `${it.slot.start}-${it.slot.end}`;

            const extendedItem: SearchResponseItemExteded = {
              ...it,
              resourceVm: this.queryService.resourceFromCache(it.resource)
            };

            if (theMap.has(hash)) {

              const group = theMap.get(hash);
              group.items = [...group.items, extendedItem].sort((a, b) => b.score - a.score);
              group.maxScore = group.maxScore > it.score ? group.maxScore : it.score
              group.sumScore += it.score;

            } else {
              theMap.set(hash, { items: [extendedItem], hash, maxScore: it.score, sumScore: it.score, slot: it.slot })
            }

            return theMap;
          }, new Map<string, { items: SearchResponseItemExteded[], hash: string, maxScore: number, sumScore: number, slot: { start: string; end: string; } }>()))
            .map(([, v]) => v)
            .sort((a, b) => b.maxScore - a.maxScore)
        }
      })
    );
  }

}
