import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface Context {
  authToken: string;
  cloudHost: string;
  account: string;
  accountId: string;
  company: string;
  companyId: string;
  user: string;
  userId: string;
  clientId: string;
  clientVersion: string;
  requestId: string;
}

export const Context = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest();

    const headers = Object.keys(req.headers).reduce((it, key) => (it.set(key, req.headers[key]).set(key.toLowerCase(), req.headers[key])), new Map())

    const context = {
      authToken: headers.get('authorization'),
      cloudHost: headers.get('x-cloud-host'),

      account: headers.get('x-account-name'),
      accountId: headers.get('x-account-id'),

      company: headers.get('x-company-name'),
      companyId: headers.get('x-company-id'),

      user: headers.get('x-user-name'),
      userId: headers.get('x-user-id'),

      clientId: headers.get('x-client-id'),
      clientVersion: headers.get('x-client-version'),
      requestId: headers.get('x-request-id'),
    } as Context;

    return context
  },
);
