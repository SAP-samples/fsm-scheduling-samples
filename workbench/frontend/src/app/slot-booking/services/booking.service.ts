import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { mergeMap, take } from 'rxjs/operators';
import { ConfigService } from '../../common/services/config.service';
import { CLIENT_IDENTIFIER } from '../../common/contants';
import { AuthService, GlobalContext } from '../../common/services/auth.service';
import { Job } from './job.service';
import { QueryService } from '../../common/services/query.service';
import { SearchResponseItem } from './slot-booking.service';

export type Progress = {
  message: string,
  blockedList: string[],
  success: boolean,
  result: {} | null,
  total: number,
  current: number,
  activityId: string;
};

@Injectable()
export class BookingService {

  constructor(
    private config: ConfigService,
    private auth: AuthService,
    private http: HttpClient,
    private query: QueryService
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

  private book(bookable: SearchResponseItem, job: Job, activityId: string = 'create-activity') {
    return this.auth.globalContextWithAuth$.pipe(
      mergeMap(ctx => this.http.post<{}>(`${this.config.getApiUri()}/booking/actions/book/${activityId}`, { job, bookable }, { headers: this.getHeaders(ctx) }))
    );
  }


  public tryBookAll(list: SearchResponseItem[], job: Job) {

    return new Observable<Progress>((op) => {

      const tryBook = (idx: number, bookable: SearchResponseItem, blockedList: string[], activityId: string): Promise<Progress> => {

        const progress = {
          success: false,
          message: '',
          blockedList: [...blockedList, bookable.resource],
          total: list.length,
          current: (idx + 1),
          result: null,
          activityId,
        }


        const person = this.query.getResourceFromCache(bookable.resource);
        op.next({ ...progress, message: `...👷 trying to book ${person.firstName} ${person.lastName} with score [${bookable.score}]` });

        return this.book(bookable, job, activityId).pipe(take(1))
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
          .catch(errorRep => {
            let activityId: string;
            // if the backend returns a 422 - creation of temp data was okay but booking failed.
            // use [activityId] for next try to not recreate data 
            if (errorRep instanceof HttpErrorResponse && errorRep.status === 422 && errorRep.error) {
              activityId = errorRep.error.activityId || ''
            }

            throw { ...progress, activityId: activityId ? activityId : '' };
          });
      }

      // setup chain 
      const work = list.reduce(
        (promise, it, idx) => promise.catch((progress: Progress) => tryBook(idx, it, progress.blockedList, progress.activityId)),
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