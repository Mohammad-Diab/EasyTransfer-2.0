import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => this.convertBigIntsToStrings(data))
    );
  }

  private convertBigIntsToStrings(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'bigint') {
      return obj.toString();
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.convertBigIntsToStrings(item));
    }

    if (typeof obj === 'object') {
      const newObj: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          newObj[key] = this.convertBigIntsToStrings(obj[key]);
        }
      }
      return newObj;
    }

    return obj;
  }
}
