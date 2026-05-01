import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://jimwang.dev',
  compressHTML: true,
  integrations: [react()],
});
