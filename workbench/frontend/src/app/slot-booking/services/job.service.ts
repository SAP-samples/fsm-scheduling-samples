import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { mergeMap } from 'rxjs/operators';
import { ConfigService } from '../../common/config.service';
import { CLIENT_IDENTIFIER } from '../../common/contants';
import { GlobalContext, AuthService } from '../../common/login-dialog/auth.service';

export type Job = {
  durationMinutes: number,
  location: {
    latitude: number,
    longitude: number
  } | null,
  mandatorySkills: string[],
}

export type TagDTO = {
  branches: null
  createDateTime: string
  createPerson: string
  description: null
  externalId: null
  groups: null
  id: string
  inactive: false
  lastChanged: number
  lastChangedBy: string
  location: null
  name: string
  owners: null
  syncObjectKPIs: null
  syncStatus: 'IN_CLOUD'
  udfMetaGroups: null
  udfValues: null
}

export type AddressDTO = {
  block: null
  branches: null
  building: null
  city: string
  country: string
  county: null
  createDateTime: string
  createPerson: string
  defaultAddress: true
  externalId: null
  floor: null
  groups: null
  id: string
  inactive: false
  lastChanged: number
  location: { latitude: number, longitude: number }
  name: string
  name2: null
  name3: null
  object: { objectId: string, objectType: string }
  owners: null
  postOfficeBox: null
  remarks: null
  room: null
  state: null
  street: string
  streetNo: string
  syncObjectKPIs: null
  syncStatus: 'IN_CLOUD'
  type: 'HOME'
  udfMetaGroups: null
  udfValues: null
  zipCode: string
}
@Injectable({
  providedIn: 'root'
})
export class JobService {

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

  fetchAllTags() {
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.get<Array<TagDTO & { persons: string[] }>>(`${this.config.getApiUri()}/query/tags`, { headers: this.getHeaders(ctx) }))
    );
  }

  fetchAllAddress() {
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.get<AddressDTO[]>(`${this.config.getApiUri()}/query/address`, { headers: this.getHeaders(ctx) })),
    );
  }

  personByTag(tagId: string) {
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.get<{ person: string, tag: string }[]>(`${this.config.getApiUri()}/query/person/by-tag/${tagId}`, { headers: this.getHeaders(ctx) })),
    );
  }
}
