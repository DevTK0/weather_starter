import type { VercelRequest, VercelResponse } from '@vercel/node';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWeatherApi, type ApiResult } from './api-service.js';
import type { WeatherSnapshot } from './weather.js';

type VercelHandler = (request: VercelRequest, response: VercelResponse) => Promise<void>;

describe('Vercel API route adapters', () => {
  let tempDir: string;
  let routes: typeof import('./vercel-routes.js');
  let resetStore: typeof import('./db.js').resetStore;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-vercel-test-'));
    process.env.DATABASE_URL = `file:${join(tempDir, 'weather.db')}`;
    delete process.env.DATABASE_AUTH_TOKEN;
    process.env.LOG_LEVEL = 'silent';

    routes = await import('./vercel-routes.js');
    ({ resetStore } = await import('./db.js'));
  });

  beforeEach(async () => {
    await resetStore();
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

  it('creates, lists, gets, and refreshes rich snapshots through the Vercel handlers', async () => {
    const getCurrentWeather = vi
      .fn()
      .mockResolvedValueOnce(initialWeather)
      .mockResolvedValueOnce(refreshedWeather);
    const api = createWeatherApi({
      weatherClient: {
        getCurrentWeather,
      },
    });

    const createResponse = await invoke(routes.createLocationsIndexHandler(api), {
      method: 'POST',
      body: { latitude: 1.35, longitude: 103.85 },
    });
    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.body).toMatchObject({
      id: 1,
      latitude: 1.35,
      longitude: 103.85,
      weather: initialWeather,
    });

    const listResponse = await invoke(routes.createLocationsIndexHandler(api), { method: 'GET' });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.body).toMatchObject({
      locations: [
        {
          id: 1,
          weather: initialWeather,
        },
      ],
    });

    const refreshResponse = await invoke(routes.createLocationRefreshHandler(api), {
      method: 'POST',
      query: { locationId: '1' },
    });
    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.body).toMatchObject({
      id: 1,
      weather: refreshedWeather,
    });

    const getResponse = await invoke(routes.createLocationDetailHandler(api), {
      method: 'GET',
      query: { locationId: '1' },
    });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body).toMatchObject({
      id: 1,
      weather: refreshedWeather,
    });
    expect(getCurrentWeather).toHaveBeenNthCalledWith(1, 1.35, 103.85);
    expect(getCurrentWeather).toHaveBeenNthCalledWith(2, 1.35, 103.85);
  });
});

const initialWeather: WeatherSnapshot = {
  condition: 'Cloudy',
  observed_at: '2026-05-04T00:00:00Z',
  source: 'vercel-test',
  area: 'Bishan',
  valid_period_text: 'Now',
  temperature_c: 29,
  humidity_percent: 80,
  rainfall_mm: 0,
  wind_speed_knots: 4,
  wind_direction_degrees: 180,
  forecast_low_c: 25,
  forecast_high_c: 32,
  uv_index: 7,
  psi_twenty_four_hourly: 42,
  pm25_one_hourly: 9,
  air_quality_region: 'central',
  forecast_periods: [
    { label: 'Now', forecast: 'Cloudy' },
    { label: '1AM', forecast: 'Partly Cloudy' },
  ],
  daily_forecast: [
    { date: '2026-05-04', forecast: 'Cloudy', temperature_low_c: 25, temperature_high_c: 32 },
  ],
};

const refreshedWeather: WeatherSnapshot = {
  condition: 'Thundery Showers',
  observed_at: '2026-05-04T01:00:00Z',
  source: 'vercel-test-refresh',
  area: 'Bishan',
  valid_period_text: '1 AM to 2 AM',
  temperature_c: 27,
  humidity_percent: 91,
  rainfall_mm: 5.4,
  wind_speed_knots: 11,
  wind_direction_degrees: 220,
  forecast_low_c: 24,
  forecast_high_c: 30,
  uv_index: 2,
  psi_twenty_four_hourly: 55,
  pm25_one_hourly: 14,
  air_quality_region: 'central',
  forecast_periods: [
    { label: '1AM', forecast: 'Thundery Showers' },
    { label: '2AM', forecast: 'Showers' },
  ],
  daily_forecast: [
    { date: '2026-05-04', forecast: 'Thundery Showers', temperature_low_c: 24, temperature_high_c: 30 },
    { date: '2026-05-05', forecast: 'Showers', temperature_low_c: 25, temperature_high_c: 31 },
  ],
};

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
