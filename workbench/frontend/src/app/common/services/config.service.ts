
import { Injectable } from '@angular/core';

@Injectable()
export class ConfigService {
  constructor() { }

  private getHost(): string {
    return location.origin === 'http://localhost:4200'
      ? 'http://localhost:8000'
      : 'https://scheduling-backend.cfapps.eu12.hana.ondemand.com';
  }

  public getApiUri(): string {
    return `${this.getHost()}/api`;
  }

}
