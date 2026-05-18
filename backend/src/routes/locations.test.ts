import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { WeatherSnapshot } from '../weather.js';

const weather: WeatherSnapshot = {
  condition: 'Cloudy',
  observed_at: '2026-05-04T00:00:00Z',
  source: 'test',
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
  forecast_periods: [{ label: 'Now', forecast: 'Cloudy' }],
  daily_forecast: [{ date: '2026-05-04', forecast: 'Cloudy', temperature_low_c: 25, temperature_high_c: 32 }],
};

describe('locations API', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('../server.js').createApp>>;
  let resetStore: typeof import('../db.js').resetStore;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-test-'));
    process.env.DATABASE_URL = `file:${join(tempDir, 'weather.db')}`;
    delete process.env.DATABASE_AUTH_TOKEN;
    process.env.LOG_LEVEL = 'silent';

    const { createApp } = await import('../server.js');
    ({ resetStore } = await import('../db.js'));
    app = await createApp({
      serveFrontend: false,
      enableRequestLogging: false,
      weatherClient: {
        async getCurrentWeather() {
          return weather;
        },
      },
    });
  });

  beforeEach(async () => {
    await resetStore();
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('refreshes weather when a location is created', async () => {
    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    expect(response.body).toMatchObject({
      id: 1,
      latitude: 1.35,
      longitude: 103.85,
      weather: {
        condition: 'Cloudy',
        area: 'Bishan',
        temperature_c: 29,
      },
    });

    const listResponse = await request(app).get('/api/locations').expect(200);
    expect(listResponse.body.locations).toHaveLength(1);
    expect(listResponse.body.locations[0].weather.condition).toBe('Cloudy');
  });

  it('prevents duplicate locations', async () => {
    await request(app).post('/api/locations').send({ latitude: 1.35, longitude: 103.85 }).expect(201);

    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(409);

    expect(response.body.detail).toBe('Location already exists');
  });

  it('gets and deletes a stored location', async () => {
    const createResponse = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.36, longitude: 103.86 })
      .expect(201);

    const locationId = createResponse.body.id;

    const getResponse = await request(app).get(`/api/locations/${locationId}`).expect(200);
    expect(getResponse.body).toMatchObject({
      id: locationId,
      latitude: 1.36,
      longitude: 103.86,
      weather: {
        condition: 'Cloudy',
      },
    });

    await request(app).delete(`/api/locations/${locationId}`).expect(204);
    await request(app).get(`/api/locations/${locationId}`).expect(404);
  });
});
