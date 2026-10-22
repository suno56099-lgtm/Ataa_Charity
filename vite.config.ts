
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const repoName = process.env.GITHUB_REPOSITORY
    ? process.env.GITHUB_REPOSITORY.split('/')[1]
    : 'Ataa_Charity';
  const isGitHubActions = Boolean(process.env.GITHUB_ACTIONS);
  const basePath = process.env.VITE_BASE_PATH || (isGitHubActions ? `/${repoName}/` : './');

  return {
    base: basePath,

    plugins: [
      react(),
      tailwindcss(),

      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png'],

        manifest: {
          id: basePath,
          name: 'جمعية عطاء - منصة إدارة المستفيدين والتوزيع',
          short_name: 'عطاء',
          description:
            'منصة رقمية لإدارة المستفيدين ونقاط السلع التموينية والتسليم لجمعية عطاء الخيرية',
          theme_color: '#0F1412',
          background_color: '#0F1412',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: basePath,
          scope: basePath,

          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },

        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        },

        devOptions: {
          enabled: false,
        },
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },

    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',

      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
