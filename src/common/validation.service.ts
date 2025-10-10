import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ZodType, ZodError } from 'zod';
import { WebResponse } from './web.response';

@Injectable()
export class ValidationService {
  validate<T>(zodType: ZodType<T>, data: unknown): T {
    try {
      return zodType.parse(data);
    } catch (err) {
      if (err instanceof ZodError) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join('.') || 'value',
          message: e.message,
        }));

        // Gunakan WebResponse tanpa "message"
        throw new HttpException(
          Object.assign(new WebResponse(), {
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            message: 'Validation failed',
            errors: formattedErrors,
          }),
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      throw err;
    }
  }
}
