import {
  createLocation,
  deleteLocation,
  getLocation,
  listLocations,
  updateWeather,
} from './db.js';
import { logger } from './logger.js';
import { SingaporeWeatherClient, WeatherProviderError, type WeatherSnapshot } from './weather.js';

export interface ForecastArea {
  name: string;
  latitude: number;
  longitude: number;
}

export interface WeatherClient {
  getCurrentWeather(latitude: number, longitude: number): Promise<WeatherSnapshot>;
  getForecastAreas?(): Promise<ForecastArea[]>;
}

export interface ApiResult {
  status: number;
  body?: unknown;
}

export interface WeatherApiOptions {
  weatherClient?: WeatherClient;
}

const FORECAST_AREAS_TTL_MS = 60 * 60 * 1000;
const FRONTEND_EVENT_PATTERN = /^[a-z][a-z0-9_.:-]{1,63}$/;

let forecastAreasCache: { fetchedAt: number; areas: ForecastArea[] } | null = null;

export function createWeatherApi(options: WeatherApiOptions = {}) {
  const weatherClient =
    options.weatherClient ?? new SingaporeWeatherClient({ apiKey: process.env.WEATHER_API_KEY });

  return {
    async getForecastAreas(): Promise<ApiResult> {
      try {
        const now = Date.now();
        if (forecastAreasCache && now - forecastAreasCache.fetchedAt < FORECAST_AREAS_TTL_MS) {
          return { status: 200, body: { areas: forecastAreasCache.areas } };
        }
        if (!weatherClient.getForecastAreas) {
          return {
            status: 501,
            body: { detail: 'Forecast areas not available from weather provider' },
          };
        }
        const areas = await weatherClient.getForecastAreas();
        forecastAreasCache = { fetchedAt: now, areas };
        return { status: 200, body: { areas } };
      } catch (error) {
        if (error instanceof WeatherProviderError) {
          return { status: 502, body: { detail: error.message } };
        }
        throw error;
      }
    },

    async listLocations(): Promise<ApiResult> {
      return { status: 200, body: { locations: await listLocations() } };
    },

    async createLocation(body: unknown): Promise<ApiResult> {
      const latitude = Number(readBodyField(body, 'latitude'));
      const longitude = Number(readBodyField(body, 'longitude'));

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return { status: 422, body: { detail: 'latitude and longitude are required' } };
      }
      if (!(1.1 <= latitude && latitude <= 1.5 && 103.6 <= longitude && longitude <= 104.1)) {
        return {
          status: 422,
          body: {
            detail: 'Coordinates must be within Singapore (lat 1.1-1.5, lon 103.6-104.1)',
          },
        };
      }

      try {
        const location = await createLocation(latitude, longitude);

        try {
          const snapshot = await weatherClient.getCurrentWeather(
            location.latitude,
            location.longitude,
          );
          const updated = await updateWeather(location.id, snapshot);
          return { status: 201, body: updated ?? location };
        } catch (error) {
          if (!(error instanceof WeatherProviderError)) throw error;
          logger.warn(
            { err: error, locationId: location.id },
            'weather refresh failed after location create',
          );
          return { status: 201, body: location };
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'DuplicateLocationError') {
          logger.warn({ err: error }, 'duplicate location rejected');
          return { status: 409, body: { detail: error.message } };
        }
        throw error;
      }
    },

    async getLocation(locationIdParam: string | number | undefined): Promise<ApiResult> {
      const locationId = Number(locationIdParam);
      const location = await getLocation(locationId);
      if (!location) {
        return { status: 404, body: { detail: 'Location not found' } };
      }
      return { status: 200, body: location };
    },

    async deleteLocation(locationIdParam: string | number | undefined): Promise<ApiResult> {
      const locationId = Number(locationIdParam);
      if (!Number.isFinite(locationId)) {
        return { status: 422, body: { detail: 'Invalid location id' } };
      }
      const removed = await deleteLocation(locationId);
      if (!removed) {
        return { status: 404, body: { detail: 'Location not found' } };
      }
      return { status: 204 };
    },

    async refreshLocation(locationIdParam: string | number | undefined): Promise<ApiResult> {
      try {
        const locationId = Number(locationIdParam);
        const location = await getLocation(locationId);
        if (!location) {
          return { status: 404, body: { detail: 'Location not found' } };
        }

        const snapshot = await weatherClient.getCurrentWeather(
          location.latitude,
          location.longitude,
        );
        const updated = await updateWeather(locationId, snapshot);
        return { status: 200, body: updated };
      } catch (error) {
        if (error instanceof WeatherProviderError) {
          return { status: 502, body: { detail: error.message } };
        }
        throw error;
      }
    },

    async logFrontendEvent(body: unknown): Promise<ApiResult> {
      const event = readBodyField(body, 'event');
      if (typeof event !== 'string' || !FRONTEND_EVENT_PATTERN.test(event)) {
        return { status: 422, body: { detail: 'event is required' } };
      }

      const metadata = readBodyField(body, 'metadata');
      logger.info(
        {
          source: 'frontend',
          event,
          metadata: metadata && typeof metadata === 'object' ? metadata : undefined,
          page: readStringBodyField(body, 'page'),
        },
        'frontend interaction',
      );
      return { status: 204 };
    },
  };
}

function readBodyField(body: unknown, field: string): unknown {
  if (!body || typeof body !== 'object') return undefined;
  return (body as Record<string, unknown>)[field];
}

function readStringBodyField(body: unknown, field: string): string | undefined {
  const value = readBodyField(body, field);
  return typeof value === 'string' ? value : undefined;
}
