import { createWeatherApi } from './api-service.js';
import { createVercelHandler, locationIdFromQuery } from './vercel-handler.js';

type WeatherApi = ReturnType<typeof createWeatherApi>;

export function createForecastAreasHandler(weatherApi: WeatherApi = createWeatherApi()) {
  return createVercelHandler({
    GET: () => weatherApi.getForecastAreas(),
  });
}

export function createLogsHandler(weatherApi: WeatherApi = createWeatherApi()) {
  return createVercelHandler({
    POST: (request) => weatherApi.logFrontendEvent(request.body),
  });
}

export function createLocationsIndexHandler(weatherApi: WeatherApi = createWeatherApi()) {
  return createVercelHandler({
    GET: () => weatherApi.listLocations(),
    POST: (request) => weatherApi.createLocation(request.body),
  });
}

export function createLocationDetailHandler(weatherApi: WeatherApi = createWeatherApi()) {
  return createVercelHandler({
    GET: (request) => weatherApi.getLocation(locationIdFromQuery(request)),
    DELETE: (request) => weatherApi.deleteLocation(locationIdFromQuery(request)),
  });
}

export function createLocationRefreshHandler(weatherApi: WeatherApi = createWeatherApi()) {
  return createVercelHandler({
    POST: (request) => weatherApi.refreshLocation(locationIdFromQuery(request)),
  });
}
