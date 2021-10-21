import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Scope
} from '@nestjs/common';
import { AxiosError } from 'axios';
@Catch()
@Injectable({ scope: Scope.DEFAULT })
export class ErrorFilter implements ExceptionFilter {

  public catch(error: Error | { error: AxiosError }, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    const status = error instanceof HttpException
      ? error.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Error';
    let inner: {} = {};

    const _inner = (error as any).error as undefined | AxiosError;

    if (!!_inner) {
      inner = typeof _inner.toJSON === 'function' ? _inner.toJSON() : {};
      message += _inner.message || '';
    }

    const errorBody = {
      timestamp: new Date().toISOString(),
      message,
      inner
    };

    response.status(status).send(errorBody);
  }
}
