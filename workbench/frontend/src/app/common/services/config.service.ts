
import { Injectable } from '@angular/core';

@Injectable()
export class ConfigService {
  constructor() { }

  private getHost() {
    return location.origin === 'http://localhost:4200'
      ? 'http://localhost:8000'
      : '';
  }

  public getApiUri() {
    return `${this.getHost()}/api`
  }

}