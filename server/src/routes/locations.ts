import type { Router } from 'express';
import { Router as createRouter } from 'express';
import { createWeatherApi, type WeatherClient } from '../api-service.js';
import { sendExpressResult } from '../http-result.js';

interface LocationsRouterOptions {
  weatherClient?: WeatherClient;
}

export function createLocationsRouter(options: LocationsRouterOptions = {}): Router {
  const router: Router = createRouter();
  const weatherApi = createWeatherApi({ weatherClient: options.weatherClient });

  router.get('/forecast-areas', async (_request, response, next) => {
    try {
      sendExpressResult(response, await weatherApi.getForecastAreas());
    } catch (error) {
      next(error);
    }
  });

  router.get('/locations', async (_request, response, next) => {
    try {
      sendExpressResult(response, await weatherApi.listLocations());
    } catch (error) {
      next(error);
    }
  });

  router.post('/locations', async (request, response, next) => {
    try {
      sendExpressResult(response, await weatherApi.createLocation(request.body));
    } catch (error) {
      next(error);
    }
  });

  router.get('/locations/:locationId', async (request, response, next) => {
    try {
      sendExpressResult(response, await weatherApi.getLocation(request.params.locationId));
    } catch (error) {
      next(error);
    }
  });

  router.delete('/locations/:locationId', async (request, response, next) => {
    try {
      sendExpressResult(response, await weatherApi.deleteLocation(request.params.locationId));
    } catch (error) {
      next(error);
    }
  });

  router.post('/locations/:locationId/refresh', async (request, response, next) => {
    try {
      sendExpressResult(response, await weatherApi.refreshLocation(request.params.locationId));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
