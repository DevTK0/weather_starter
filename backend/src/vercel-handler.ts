import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ApiResult } from './api-service.js';
import { logger } from './logger.js';

type HandlerAction = (request: VercelRequest) => Promise<ApiResult>;

export function createVercelHandler(methods: Partial<Record<string, HandlerAction>>) {
  return async function handler(request: VercelRequest, response: VercelResponse) {
    const method = request.method?.toUpperCase() ?? 'GET';
    const action = methods[method];

    if (!action) {
      response.setHeader('Allow', Object.keys(methods).join(', '));
      response.status(405).json({ detail: 'Method not allowed' });
      return;
    }

    try {
      sendVercelResult(response, await action(request));
    } catch (error) {
      logger.error({ err: error }, 'request failed');
      response.status(500).json({ detail: 'Internal server error' });
    }
  };
}

export function locationIdFromQuery(request: VercelRequest): string | undefined {
  const value = request.query.locationId;
  return Array.isArray(value) ? value[0] : value;
}

function sendVercelResult(response: VercelResponse, result: ApiResult): void {
  response.status(result.status);
  if (result.status === 204 || result.body === undefined) {
    response.end();
    return;
  }
  response.json(result.body);
}
