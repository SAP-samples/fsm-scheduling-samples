import { HttpService, Injectable } from '@nestjs/common';
import { Context } from '../../ctx.decorator';
import { AxiosRequestConfig, AxiosError } from 'axios';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { FSM_HOSTS_CORESUITE_TO_COREINFRA } from 'src/common/constants';

export type PluginDto = {
  is: string,
  name: string;
  description: string;
  defaultPlugin: boolean;
  pluginCode: string;
  scheduleConfigId: string;
}

@Injectable()
export class AiDataAPIDAO {

  constructor(private http: HttpService) { }

  private resolveHost(host: string) {
    return `https://${FSM_HOSTS_CORESUITE_TO_COREINFRA.get(host.toLowerCase()) || ''}`;
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
      'Accept': 'application/json',
      'Authorization': ctx.authToken,
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

  private request<T>(config: AxiosRequestConfig) {
    const requestStart: Date = new Date();
    return this.http.request<T>(config).pipe(
      tap(response => {
        try {
          const elapsedMilliseconds: number = new Date().getTime() - requestStart.getTime();
          console.debug(
            `[AiDataAPIDAO:${config.method}] url: [${config.url}] response: [${JSON.stringify(response ? response.status : null)}], time: [${elapsedMilliseconds}]`,
          );
        } catch {
          console.debug(`[AiDataAPIDAO:${config.method}] url: [${config.url}] response[UNPROCESSIBLE]`);
        }
      }),
      catchError((error: AxiosError) => {
        console.error('AiDataAPIDAO', error);
        return throwError({ error });
      })
    );
  }

  getAll(ctx: Context) {
    return this.request<PluginDto[]>({
      method: 'GET',
      url: `${this.resolveHost(ctx.cloudHost)}/cloud-ai-policy-designer/api/optimization/v1/policies`,
      headers: this.getHeaders(ctx),
      params: this.getParams(ctx),
      responseType: 'json',
    });
  }

  getById(ctx: Context, id: string) {
    return this.request<PluginDto>({
      method: 'GET',
      url: `${this.resolveHost(ctx.cloudHost)}/cloud-ai-data-service/api/autoscheduler/v1/optimization-plugins/${id}`,
      headers: this.getHeaders(ctx),
      params: this.getParams(ctx),
      responseType: 'json',
    });
  }

  getByName(ctx: Context, name: string) {
    return this.request<PluginDto[]>({
      method: 'GET',
      url: `${this.resolveHost(ctx.cloudHost)}/cloud-ai-policy-designer/api/optimization/v1/policies/by-name/${name}`,
      headers: this.getHeaders(ctx),
      params: this.getParams(ctx),
      responseType: 'json',
    });
  }

  create(ctx: Context, plugin: Partial<PluginDto>) {
    return this.request<PluginDto[]>({
      method: 'POST',
      url: `${this.resolveHost(ctx.cloudHost)}/cloud-ai-data-service/api/autoscheduler/v1/optimization-plugins`,
      headers: this.getHeaders(ctx),
      params: this.getParams(ctx),
      responseType: 'json',
      data: plugin
    });
  }

  updateById(ctx: Context, id: string, plugin: Partial<PluginDto>) {
    return this.request<PluginDto[]>({
      method: 'PUT',
      url: `${this.resolveHost(ctx.cloudHost)}/cloud-ai-data-service/api/autoscheduler/v1/optimization-plugins/${id}`,
      headers: this.getHeaders(ctx),
      params: this.getParams(ctx),
      responseType: 'json',
      data: plugin
    });
  }

  deleteById(ctx: Context, id: string) {
    return this.request<PluginDto>({
      method: 'DELETE',
      url: `${this.resolveHost(ctx.cloudHost)}/cloud-ai-data-service/api/autoscheduler/v1/optimization-plugins/${id}`,
      headers: this.getHeaders(ctx),
      params: this.getParams(ctx),
      responseType: 'json',
    });
  }
}
