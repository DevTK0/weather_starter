export const serverEnvKeys = {
  databaseUrl: 'DATABASE_URL',
  databaseAuthToken: 'DATABASE_AUTH_TOKEN',
  weatherApiKey: 'WEATHER_API_KEY',
} as const;

export type ServerEnvKey = (typeof serverEnvKeys)[keyof typeof serverEnvKeys];

export type ServerConfig = {
  databaseUrl?: string;
  databaseAuthToken?: string;
  weatherApiKey?: string;
};

export function readServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    databaseUrl: readOptionalEnv(env, serverEnvKeys.databaseUrl),
    databaseAuthToken: readOptionalEnv(env, serverEnvKeys.databaseAuthToken),
    weatherApiKey: readOptionalEnv(env, serverEnvKeys.weatherApiKey),
  };
}

export function missingDeploymentEnv(env: NodeJS.ProcessEnv = process.env): ServerEnvKey[] {
  return Object.values(serverEnvKeys).filter((key) => !readOptionalEnv(env, key));
}

function readOptionalEnv(env: NodeJS.ProcessEnv, key: ServerEnvKey): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}
