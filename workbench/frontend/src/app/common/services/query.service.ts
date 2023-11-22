import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, mergeMap, tap } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { CLIENT_IDENTIFIER } from '../contants';
import { AuthService, GlobalContext } from './auth.service';
import { combineLatest, Observable, ObservableInput } from 'rxjs';

type PersonObj = { id: string, firstName: string, lastName: string, skills: { name: string, start: string, end: string }[] };
type ActivityObj = { id: string, subject: string; startDateTime: string, earliestStartDateTime: string, dueDateTime: string, code: string };
type TagObj = { id: string, name: string };
type SkillObj = { id: string, tag: string, person: string, endDate: string, startDate: string };

type InternalCache = {
  resource: Map<string, PersonObj>;
  activity: Map<string, ActivityObj>;
};

interface QueryResponse<T> {
  data: T[];
}

@Injectable({
  providedIn: 'root'
})
export class QueryService {


  // tslint:disable-next-line:variable-name
  private __cache: InternalCache = {
    resource: new Map<string, PersonObj>(),
    activity: new Map<string, ActivityObj>()
  };

  public static toLastChangedDateStringFormat = (lastChanged: number): string => {
    // ¯\_(ツ)_/¯ queryApi only supports dateTime on [lastChanged]
    // but only formats supported are:
    // [yyyy-MM-ddThh:mm:ssZ]
    // [yyyy-MM-dd hh:mm:ss.SSS]
    // ISO:
    // [yyyy-MM-ddThh:mm:ss.SSSZ] is NOT supported
    return new Date(lastChanged)
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '');
  }

  public static trimMilliseconds = (dateString: string) => {
    // ¯\_(ツ)_/¯ queryApi and dates ...
    // ISO: [yyyy-MM-ddThh:mm:ss.SSSZ] is NOT supported
    // but
    // [yyyy-MM-ddThh:mm:ssZ]
    return new Date(new Date(dateString).setMilliseconds(0)).toISOString().replace('.000', '');
  }


  private getCache<T extends Map<string, any>>(key: keyof InternalCache): T {
    return this.__cache[key] as T;
  }

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

  private addToCache(key: keyof InternalCache, list: Partial<PersonObj>[] | Partial<ActivityObj>[]): void {
    if (Array.isArray(list)) {
      list.forEach(item => {
        if (key === 'resource' && item && item.id && !this.getCache(key).has(item.id)) {
          this.getCache(key).set(item.id, { ...item, firstName: (item.firstName || ''), lastName: (item.lastName || '') });
        }

        if (key === 'activity' && item && item.id && !this.getCache(key).has(item.id)) {
          this.getCache(key).set(item.id, { ...item });
        }
      });
    }
  }

  // tslint:disable-next-line:max-line-length
  private _query<T_LIST extends QueryResponse<T_ITEM>, T_ITEM extends {}>(query: string): Observable<Observable<T_LIST> extends ObservableInput<infer T> ? T : never> {
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.post<T_LIST>(`${this.config.getApiUri()}/query`, { query }, { headers: this.getHeaders(ctx) }))
    );
  }

  public queryActivities<list extends item[],
    item extends ActivityObj>(query: string): Observable<Observable<QueryResponse<item>> extends ObservableInput<infer T> ? T : never> {
    return this._query<QueryResponse<item>, item>(query).pipe(
      tap((currentList) => this.addToCache('activity', currentList.data))
    );
  }


  public queryResourceSkills<list extends QueryResponse<item>, item extends {
    id: string,
    firstName: string,
    lastName: string,
    skills: { name: string, start: string, end: string }[]
  }>(query: string): Observable<any> {
    return combineLatest([
      this._query<list, item>(query),
      this._query<QueryResponse<TagObj>, TagObj>(`SELECT tag.id as id, tag.name as name
                                                  FROM Tag tag
                                                  WHERE tag.inactive = false`),
      this._query<QueryResponse<SkillObj>, SkillObj>(`SELECT skill.id        as id,
                                                             skill.tag       as tag,
                                                             skill.person    as person,
                                                             skill.startDate as startDate,
                                                             skill.endDate   as endDate
                                                      FROM Skill skill
                                                      WHERE skill.inactive = false`)
    ]).pipe(
      map(([resources, tags, skills]) => {
        const tagMap = tags.data.reduce((m, { id, name }) => m.set(id, name), new Map<string, string>());
        const skillMap = skills.data.reduce((m, skill) => {
          const currentItem = {
            name: (tagMap.get(skill.tag) || skill.tag),
            start: skill.startDate === 'null' ? null : skill.startDate,
            end: skill.endDate === 'null' ? null : skill.endDate
          };
          if (m.has(skill.person)) {
            m.get(skill.person)?.push(currentItem);
          } else {
            m.set(skill.person, [currentItem]);
          }
          return m;
        }, new Map<string, { name: string, start: string, end: string }[]>());

        return resources.data.map(it => ({
          ...it,
          skills: skillMap.has(it.id) ? skillMap.get(it.id).sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)) : []
        }));
      }),
      tap((currentList) => this.addToCache('resource', currentList))
    );
  }

  public getResourceFromCache(id: string): PersonObj {
    return this.getCache('resource').has(id)
      ? this.getCache('resource').get(id)
      : { id, firstName: 'N/A', lastName: 'N/A', skills: [] };
  }
}
