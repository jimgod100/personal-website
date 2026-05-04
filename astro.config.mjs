import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  site: 'https://jimwang.dev',
  compressHTML: true,
  integrations: [react()],
  vite: {
    plugins: [glsl()]
  }
});
