import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, mergeMap, tap, withLatestFrom } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { CLIENT_IDENTIFIER } from '../contants';
import { GlobalContext, AuthService } from './auth.service';
import { combineLatest, of } from 'rxjs';

type PersonObj = { id: string, firstName: string, lastName: string, skills: { name: string, start: string, end: string }[]; udfValues: { meta: string, value: string; name: string }[] };
type ActivityObj = { id: string, subject: string; startDateTime: string, earliestStartDateTime: string, dueDateTime: string, code: string };
type TagObj = { id: string, name: string };
type SkillObj = { id: string, tag: string, person: string, endDate: string, startDate: string };

type InternalCache = {
  resource: Map<string, PersonObj>;
  activity: Map<string, ActivityObj>;
  udfMetaMap: Map<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class QueryService {

  private __cache: InternalCache = {
    resource: new Map<string, PersonObj>(),
    activity: new Map<string, ActivityObj>(),
    udfMetaMap: null
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

  private addToCache(key: keyof InternalCache, list: Partial<PersonObj>[] | Partial<ActivityObj>[] | Map<string, string>) {
    if (Array.isArray(list)) {
      list.forEach(item => {
        if (key === 'resource' && item && item.id && !this.getCache(key).has(item.id)) {
          this.getCache(key).set(item.id, { ...item, firstName: (item.firstName || ''), lastName: (item.lastName || '') });
        }

        if (key === 'activity' && item && item.id && !this.getCache(key).has(item.id)) {
          this.getCache(key).set(item.id, { ...item });
        }

        if (key === 'udfMetaMap') {
          this.getCache(key).set(item.id, { ...item });
        }
      });
    }
  }

  private _query<T_LIST extends T_ITEM[], T_ITEM extends {}>(query: string) {
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.post<T_LIST>(`${this.config.getApiUri()}/query`, { query }, { headers: this.getHeaders(ctx) })),
    );
  }

  private getUdfMetaMap<list extends item[], item extends { udfMeta: { id: string, name: string } }>() {
    return this.__cache.udfMetaMap == null
      ? this._query<list, item>(`SELECT udfMeta FROM UdfMeta udfMeta ORDER BY udfMeta.name ASC`).pipe(
        map(r => r.map(it => it.udfMeta).reduce((m, { id, name }) => m.set(id, name), new Map<string, string>())),
        tap((theMap) => this.addToCache('udfMetaMap', theMap))
      )
      : of(this.__cache.udfMetaMap)
  }

  public queryActivities<list extends item[], item extends ActivityObj>(query: string) {
    return this._query<list, item>(query).pipe(
      tap((list) => this.addToCache('activity', list))
    )
  }


  public queryResource<list extends item[], item extends { resource: { id: string, firstName: string, lastName: string, udfValues: { meta: string, value: string }[] } }>(query: string) {
    return combineLatest([
      this._query<list, item>(query),
      this._query<TagObj[], TagObj>(`SELECT tag.id as id, tag.name as name FROM Tag tag WHERE tag.inactive = false`),
      this._query<SkillObj[], SkillObj>(`SELECT skill.id as id, skill.tag as tag, skill.person as person, skill.startDate as startDate, skill.endDate as endDate FROM Skill skill WHERE skill.inactive = false`),
      this.getUdfMetaMap()
    ])
      .pipe(
        map(([resp, tags, skills, udfMap]) => {
          const tagMap = tags.reduce((m, { id, name }) => m.set(id, name), new Map<string, string>())
          const skillMap = skills.reduce((m, skill) => {
            const item = {
              name: (tagMap.get(skill.tag) || skill.tag),
              start: skill.startDate === "null" ? null : skill.startDate,
              end: skill.endDate === "null" ? null : skill.endDate,
            };
            if (m.has(skill.person)) {
              m.get(skill.person)?.push(item)
            } else {
              m.set(skill.person, [item])
            }
            return m;
          }, new Map<string, { name: string, start: string, end: string }[]>())

          return resp.map(it => it.resource).map(it => ({
            ...it,
            udfValues: (it.udfValues || []).map(it => ({ ...it, name: udfMap.get(it.meta) })).sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)),
            skills: skillMap.has(it.id) ? skillMap.get(it.id).sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)) : []
          }))
        }),
        tap((list) => this.addToCache('resource', list))
      );
  }

  public getResourceFromCache(id: string): PersonObj {
    return this.getCache('resource').has(id)
      ? this.getCache('resource').get(id)
      : { id, firstName: 'N/A', lastName: 'N/A', skills: [] };
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
