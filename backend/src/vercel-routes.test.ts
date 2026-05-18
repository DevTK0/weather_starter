import type { VercelRequest, VercelResponse } from '@vercel/node';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { ApiResult } from './api-service.js';

type VercelHandler = (request: VercelRequest, response: VercelResponse) => Promise<void>;

describe('Vercel API route adapters', () => {
  let tempDir: string;
  let routes: typeof import('./vercel-routes.js');

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-vercel-test-'));
    process.env.DATABASE_URL = `file:${join(tempDir, 'weather.db')}`;
    delete process.env.DATABASE_AUTH_TOKEN;
    process.env.LOG_LEVEL = 'silent';

    routes = await import('./vercel-routes.js');
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('maps /api/locations methods to the shared API service', async () => {
    const api = fakeWeatherApi({
      listLocations: vi.fn(async () => ({ status: 200, body: { locations: [] } })),
      createLocation: vi.fn(async () => ({ status: 201, body: { id: 1 } })),
    });
    const handler = routes.createLocationsIndexHandler(api);

    const getResponse = await invoke(handler, { method: 'GET' });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body).toEqual({ locations: [] });

    const postBody = { latitude: 1.35, longitude: 103.85 };
    const postResponse = await invoke(handler, { method: 'POST', body: postBody });
    expect(postResponse.statusCode).toBe(201);
    expect(postResponse.body).toEqual({ id: 1 });
    expect(api.createLocation).toHaveBeenCalledWith(postBody);
  });

  it('maps dynamic location routes to the location id query param', async () => {
    const api = fakeWeatherApi({
      getLocation: vi.fn(async () => ({ status: 200, body: { id: 7 } })),
      deleteLocation: vi.fn(async () => ({ status: 204 })),
    });
    const handler = routes.createLocationDetailHandler(api);

    const getResponse = await invoke(handler, {
      method: 'GET',
      query: { locationId: '7' },
    });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body).toEqual({ id: 7 });
    expect(api.getLocation).toHaveBeenCalledWith('7');

    const deleteResponse = await invoke(handler, {
      method: 'DELETE',
      query: { locationId: ['7'] },
    });
    expect(deleteResponse.statusCode).toBe(204);
    expect(deleteResponse.ended).toBe(true);
    expect(api.deleteLocation).toHaveBeenCalledWith('7');
  });

  it('maps refresh, forecast areas, logs, and unsupported methods', async () => {
    const api = fakeWeatherApi({
      refreshLocation: vi.fn(async () => ({ status: 200, body: { id: 3 } })),
      getForecastAreas: vi.fn(async () => ({ status: 200, body: { areas: [] } })),
      logFrontendEvent: vi.fn(async () => ({ status: 204 })),
    });

    const refreshResponse = await invoke(routes.createLocationRefreshHandler(api), {
      method: 'POST',
      query: { locationId: '3' },
    });
    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.body).toEqual({ id: 3 });
    expect(api.refreshLocation).toHaveBeenCalledWith('3');

    const areasResponse = await invoke(routes.createForecastAreasHandler(api), { method: 'GET' });
    expect(areasResponse.statusCode).toBe(200);
    expect(areasResponse.body).toEqual({ areas: [] });

    const logBody = { event: 'locations.add', page: '/' };
    const logsResponse = await invoke(routes.createLogsHandler(api), {
      method: 'POST',
      body: logBody,
    });
    expect(logsResponse.statusCode).toBe(204);
    expect(api.logFrontendEvent).toHaveBeenCalledWith(logBody);

    const unsupportedResponse = await invoke(routes.createForecastAreasHandler(api), {
      method: 'POST',
    });
    expect(unsupportedResponse.statusCode).toBe(405);
    expect(unsupportedResponse.body).toEqual({ detail: 'Method not allowed' });
    expect(unsupportedResponse.headers.Allow).toBe('GET');
  });
});

function fakeWeatherApi(overrides: Record<string, unknown>) {
  return {
    getForecastAreas: vi.fn(async (): Promise<ApiResult> => ({ status: 501 })),
    listLocations: vi.fn(async (): Promise<ApiResult> => ({ status: 200, body: { locations: [] } })),
    createLocation: vi.fn(async (): Promise<ApiResult> => ({ status: 201, body: {} })),
    getLocation: vi.fn(async (): Promise<ApiResult> => ({ status: 404, body: {} })),
    deleteLocation: vi.fn(async (): Promise<ApiResult> => ({ status: 204 })),
    refreshLocation: vi.fn(async (): Promise<ApiResult> => ({ status: 404, body: {} })),
    logFrontendEvent: vi.fn(async (): Promise<ApiResult> => ({ status: 204 })),
    ...overrides,
  };
}

async function invoke(
  handler: VercelHandler,
  request: { method: string; query?: VercelRequest['query']; body?: unknown },
) {
  const response = createResponse();
  await handler(
    {
      method: request.method,
      query: request.query ?? {},
      body: request.body,
    } as VercelRequest,
    response as unknown as VercelResponse,
  );
  return response;
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    ended: false,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      this.ended = true;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
  };
}
