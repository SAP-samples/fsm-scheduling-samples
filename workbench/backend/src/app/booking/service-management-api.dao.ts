import { HttpService, Injectable } from '@nestjs/common';
import { Context } from '../../ctx.decorator';
import { AxiosRequestConfig, AxiosError } from 'axios';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { FSM_HOSTS_CORESUITE_TO_CORESYSTEMS } from 'src/common/constants';
import { ActivityActionsRequest } from './service-management.model';


@Injectable()
export class ServiceManagementAPIDAO {

  constructor(private http: HttpService) { }

  private resolveHost(host: string) {
    return `https://${FSM_HOSTS_CORESUITE_TO_CORESYSTEMS.get(host.toLowerCase()) || ''}`;
  }

  private getParams(ctx: Context) {
    return undefined;
  }

  private getHeaders(ctx: Context) {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': ctx.authToken,
      'X-Request-Id': ctx.requestId,
      'X-Account-Id': ctx.accountId,
      'X-Account-Name': ctx.account,
      'X-Company-Id': ctx.companyId,
      'X-Company-Name': ctx.company,
      'X-Client-Id': ctx.clientId,
      'X-Client-Version': ctx.clientVersion,
    };
  }

  private request<T>(config: AxiosRequestConfig) {
    const requestStart: Date = new Date();
    return this.http.request<T>(config).pipe(
      tap(response => {
        try {
          const elapsedMilliseconds: number = new Date().getTime() - requestStart.getTime();
          console.debug(
            `[ServiceManagementAPIDAO:${config.method}] url: [${config.url}] response: [${JSON.stringify(response ? response.status : null)}], time: [${elapsedMilliseconds}]`,
          );
        } catch {
          console.debug(`[ServiceManagementAPIDAO:${config.method}] url: [${config.url}] response[UNPROCESSIBLE]`);
        }
      }),
      catchError((error: AxiosError) => {
        console.error('ServiceManagementAPIDAO', error);
        return throwError({ error });
      })
    );
  }

  public plan(ctx: Context, activityId: {}, data: Partial<ActivityActionsRequest>) {
    return this.request<{}>({
      method: 'POST',
      url: `${this.resolveHost(ctx.cloudHost)}/api/service-management/v2/activities/${activityId}/actions/plan`,
      headers: this.getHeaders(ctx),
      params: this.getParams(ctx),
      responseType: 'json',
      data
    });
  }

  public release(ctx: Context, activityId: {}) {
    return this.request<{}>({
      method: 'POST',
      url: `${this.resolveHost(ctx.cloudHost)}/api/service-management/v2/activities/${activityId}/actions/release`,
      headers: this.getHeaders(ctx),
      params: this.getParams(ctx),
      responseType: 'json'
    });
  }
}
