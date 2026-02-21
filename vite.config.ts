import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: './',
    plugins: [
      react(),
      electron([
        {
          entry: 'electron/main.ts',
          onstart(options) {
            options.startup();
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              sourcemap: true,
              rollupOptions: {
                external: ['better-sqlite3', 'electron']
              }
            }
          }
        },
        {
          entry: 'electron/preload.ts',
          onstart(options) {
            options.reload();
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              sourcemap: true
            }
          }
        }
      ]),
      renderer(),
      // Sentry Vite plugin should be after other plugins
      sentryVitePlugin({
        org: env.SENTRY_ORG,
        project: env.SENTRY_PROJECT,
        authToken: env.SENTRY_AUTH_TOKEN,
        sourcemaps: {
          assets: ['./dist/**', './dist-electron/**'],
        },
        disable: !env.SENTRY_AUTH_TOKEN, // Disable if no auth token (e.g. local dev)
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 5173
    },
    build: {
      sourcemap: true, // Enable sourcemaps for renderer
    }
  };
});
