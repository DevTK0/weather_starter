import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { frontmanPlugin } from '@frontman-ai/vite';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    frontmanPlugin({
      host: 'api.frontman.sh',
      projectRoot: frontendRoot,
      sourceRoot: frontendRoot,
    }) as PluginOption,
  ],
});
