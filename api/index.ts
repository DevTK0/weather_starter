import 'dotenv/config';
import express from 'express';
import { createWeatherApi } from '../server/src/api-service.js';
import { sendExpressResult } from '../server/src/http-result.js';
import { logger } from '../server/src/logger.js';
import { createLocationsRouter } from '../server/src/routes/locations.js';

const app = express();

app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ status: 'healthy' });
});

app.post(['/logs', '/api/logs'], async (request, response, next) => {
  try {
    sendExpressResult(response, await createWeatherApi().logFrontendEvent(request.body));
  } catch (error) {
    next(error);
  }
});

app.use('/', createLocationsRouter());
app.use('/api', createLocationsRouter());

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error({ err: error }, 'request failed');
    response.status(500).json({ detail: 'Internal server error' });
  },
);

export default app;
