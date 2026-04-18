import { ArgumentsHost, Catch, ExceptionFilter, ForbiddenException } from '@nestjs/common';
import type { Response } from 'express';

/** Réponse JSON homogène pour les 403 (pas de page HTML). */
@Catch(ForbiddenException)
export class ForbiddenJsonFilter implements ExceptionFilter {
  catch(exception: ForbiddenException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    response.status(403).json({
      error: 'Forbidden',
      message: exception.message,
      status: 403,
    });
  }
}
