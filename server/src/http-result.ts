import type { Response } from 'express';
import type { ApiResult } from './api-service.js';

export function sendExpressResult(response: Response, result: ApiResult): void {
  response.status(result.status);
  if (result.status === 204 || result.body === undefined) {
    response.end();
    return;
  }
  response.json(result.body);
}
