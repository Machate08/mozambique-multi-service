import react from '@vitejs/plugin-react';
import path from 'path';

export default {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), '.'),
    },
  },
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
    'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
};
