import { HttpService, Injectable } from '@nestjs/common';
import { Context } from '../../ctx.decorator';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {
  FSM_HOSTS_CORESUITE_TO_COREINFRA,
  FSM_HOSTS_CORESUITE_TO_SAPCLOUD,
} from 'src/common/constants';
import { AGHRequestDTO, AGHResponseDTO } from '../../common/dto-models';

@Injectable()
export class AghApiDao {
  constructor(private http: HttpService) {}

  private resolveHost(host: string) {
    return `https://${FSM_HOSTS_CORESUITE_TO_COREINFRA.get(
      host.toLowerCase(),
    ) || ''}`;
  }

  private resolveSAPCloudHost(host: string) {
    return `https://${FSM_HOSTS_CORESUITE_TO_SAPCLOUD.get(host.toLowerCase()) ||
      ''}`;
  }

  private getParams(ctx: Context) {
    return {
      companyId: ctx.companyId,
      company: ctx.company,
      accountId: ctx.accountId,
      account: ctx.account,
    };
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

      companyId: ctx.companyId,
      accountId: ctx.accountId,
    };
  }

  private request<T>(config: AxiosRequestConfig) {
    const requestStart: Date = new Date();
    return this.http.request<T>(config).pipe(
      tap(response => {
        try {
          const elapsedMilliseconds: number =
            new Date().getTime() - requestStart.getTime();
          console.debug(
            `[AghApiDAO:${config.method}] url: [${
              config.url
            }] response: [${JSON.stringify(
              response ? response.status : null,
            )}], time: [${elapsedMilliseconds}]`,
          );
        } catch {
          console.debug(
            `[AghApiDAO:${config.method}] url: [${config.url}] response[PROCESSABLE]`,
          );
        }
      }),
      catchError((error: AxiosError) => {
        console.error('AiDataAPIDAO', error);
        return throwError({ error });
      }),
    );
  }

  getTechnicians(ctx: Context, data: Partial<AGHRequestDTO>) {
    return this.request<AGHResponseDTO>({
      method: 'POST',
      url: `${this.resolveHost(
        ctx.cloudHost,
      )}/aggregation-hub/api/v1/resources`,
      headers: this.getHeaders(ctx),
      params: this.getParams(ctx),
      responseType: 'json',
      data
    });
  }
}
