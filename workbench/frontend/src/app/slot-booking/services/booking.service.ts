import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { mergeMap, take } from 'rxjs/operators';
import { ConfigService } from '../../common/services/config.service';
import { CLIENT_IDENTIFIER } from '../../common/contants';
import { AuthService, GlobalContext } from '../../common/services/auth.service';
import { Job } from './job.service';
import { ResourceQueryService } from '../../common/services/resource-query.service';
import { SearchResponseItem } from './slot-booking.service';

export type Progress = {
  message: string,
  blockedList: string[],
  success: boolean,
  result: {} | null,
  total: number,
  current: number
};

@Injectable()
export class BookingService {

  constructor(
    private config: ConfigService,
    private auth: AuthService,
    private http: HttpClient,
    private query: ResourceQueryService
  ) { }

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

  private book(bookable: SearchResponseItem, job: Job) {
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.post<{}>(`${this.config.getApiUri()}/booking/actions/book`, { job, bookable }, { headers: this.getHeaders(ctx) }))
    );
  }


  public tryBookAll(list: SearchResponseItem[], job: Job) {

    return new Observable<Progress>((op) => {

      const tryBook = (idx: number, bookable: SearchResponseItem, blockedList: string[]): Promise<Progress> => {
        const progress = {
          success: false,
          message: '',
          blockedList: [...blockedList, bookable.resource],
          total: list.length,
          current: (idx + 1),
          result: null
        }


        const person = this.query.resourceFromCache(bookable.resource);
        op.next({ ...progress, message: `...👷 trying to book ${person.firstName} ${person.lastName} with score [${bookable.score}]` });

        return this.book(bookable, job).pipe(take(1))
          .toPromise()
          .then(result => {
            // exit loop
            return ({
              ...progress,
              success: true,
              message: `🎉🎉 we booked a slot with ${person.firstName} ${person.lastName} from ${moment(bookable.start).format('HH:mm')} to ${moment(bookable.end).format('HH:mm')} `,
              result
            })
          })
          .catch(error => { throw progress; });
      }

      // setup chain 
      const work = list.reduce(
        (promise, it, idx) => promise.catch(
          (progress) => tryBook(idx, it, progress.blockedList)),
        Promise.reject({ message: `init`, blockedList: [], success: false, total: list.length, current: -1 })
      )

      // run chain
      work
        .then(r => {
          op.next(r);
          op.complete();
        })
        .catch((error: Progress) => {
          op.next({ ...error, message: '❌ slot booking failed, all technicains are booked already ...' });
          op.error(error);
        });

      return () => {
        // clean ups
      }
    })

  };

}