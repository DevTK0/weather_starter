import { createLogger } from '../utils/logger';

const logger = createLogger('api.client');

const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const method = options.method || 'GET';
  const url = `${API_BASE}${endpoint}`;
  const start = performance.now();

  logger.info('fetch_request', { method, url });

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const duration_ms = Math.round(performance.now() - start);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      logger.warn('fetch_response_error', {
        method,
        url,
        status_code: response.status,
        duration_ms,
        detail: error.detail || 'Request failed',
      });
      throw new Error(error.detail || 'Request failed');
    }

    logger.info('fetch_response', {
      method,
      url,
      status_code: response.status,
      duration_ms,
    });

    if (response.status === 204) return null;
    return response.json();
  } catch (err) {
    if (err.message && err.message !== 'Request failed') {
      const duration_ms = Math.round(performance.now() - start);
      logger.error('fetch_exception', {
        method,
        url,
        duration_ms,
        error: err.message,
      });
    }
    throw err;
  }
}
