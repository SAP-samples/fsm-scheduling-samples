import { Injectable } from '@nestjs/common';
import { CoreAPIClient } from 'fsm-sdk'
import { ALL_DTO_VERSIONS } from 'fsm-sdk/release/core/all-dto-versions.constant';
import { configService } from 'src/common/config.service';
import { Context } from '../ctx.decorator';

@Injectable()
export class FsmAPIClientFactory {

  public fromContext(ctx: Context) {
    return new CoreAPIClient({
      debug: configService.useVerboseLogs(),
      clientIdentifier: ctx.clientId,
      clientVersion: ctx.clientVersion,
      clientSecret: 'none',
      authAccountName: ctx.account,
      authCompany: ctx.company,
      authUserName: ctx.user
    }).setToken({
      access_token: ctx.authToken.split(' ')[1],
      token_type: ctx.authToken.split(' ')[0],
      expires_in: null,
      scope: 'n/a',
      account: ctx.account,
      account_id: parseInt(ctx.accountId),
      user: ctx.user,
      user_email: null,
      companies: [{ name: ctx.company, id: parseInt(ctx.companyId), strictEncryptionPolicy: false, description: '' }],
      authorities: [],
      cluster_url: `https://${ctx.cloudHost}`
    })
  }

  public ALL_DTO_VERSIONS: { [name: string]: number } = ALL_DTO_VERSIONS;
}