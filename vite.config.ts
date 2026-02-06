
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Specifically define process.env.API_KEY for the browser.
    // We avoid passing the whole process.env object because it contains non-serializable Node.js data.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || '')
    }
  }
});
