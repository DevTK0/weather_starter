import 'dotenv/config';
import express from 'express';
import pinoHttpModule from 'pino-http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createLocationsRouter } from './routes/locations.js';
import { createWeatherApi, type WeatherClient } from './api-service.js';
import { sendExpressResult } from './http-result.js';
import { logger } from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pinoHttp = pinoHttpModule.default ?? pinoHttpModule;

interface AppOptions {
  serveFrontend?: boolean;
  enableRequestLogging?: boolean;
  weatherClient?: WeatherClient;
}

export async function createApp(options: AppOptions = {}) {
  const app = express();
  const serveFrontend = options.serveFrontend ?? process.env.NODE_ENV !== 'test';
  const enableRequestLogging = options.enableRequestLogging ?? process.env.NODE_ENV !== 'test';

  if (enableRequestLogging) {
    app.use(pinoHttp({ logger }));
  }

  app.use((request, response, next) => {
    if (request.path.startsWith('/frontman')) {
      next();
      return;
    }

    express.json()(request, response, next);
  });

  app.get('/health', (_request, response) => {
    response.json({ status: 'healthy' });
  });

  app.post('/api/logs', async (request, response, next) => {
    try {
      const weatherApi = createWeatherApi({ weatherClient: options.weatherClient });
      sendExpressResult(response, await weatherApi.logFrontendEvent(request.body));
    } catch (error) {
      next(error);
    }
  });

  app.use('/api', createLocationsRouter({ weatherClient: options.weatherClient }));

  if (serveFrontend) {
    if (process.env.NODE_ENV === 'production') {
      const staticPath = resolve(__dirname, '..', '..', 'frontend', 'dist');
      app.use(express.static(staticPath));
      app.get('*', (_request, response) => {
        response.sendFile(resolve(staticPath, 'index.html'));
      });
    } else {
      const { createServer } = await import('vite');
      const vite = await createServer({
        root: resolve(__dirname, '..', '..', 'frontend'),
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  }

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

  return app;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 3000);
  const app = await createApp();

  app.listen(port, '127.0.0.1', () => {
    logger.info({ url: `http://127.0.0.1:${port}` }, 'Weather Starter listening');
  });
}
