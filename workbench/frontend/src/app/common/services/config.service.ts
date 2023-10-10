
import { Injectable } from '@angular/core';

@Injectable()
export class ConfigService {
  constructor() { }

  private getHost(): 'http://localhost:8000' | '' {
    return location.origin === 'http://localhost:4200'
      ? 'http://localhost:8000'
      : '';
  }

  public getApiUri(): string {
    return `${this.getHost()}/api`;
  }

}
