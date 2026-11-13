import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export default defineConfig({
  build: {
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  // Explicitly allowlist public build identifiers. Never ship all process.env.
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV === 'development' ? 'development' : 'production'),
    'process.env.DFX_NETWORK': JSON.stringify(process.env.DFX_NETWORK === 'local' ? 'local' : 'ic'),
    'process.env.CANISTER_ID_PROFILE': JSON.stringify(process.env.CANISTER_ID_PROFILE || ''),
    'process.env.CANISTER_ID_PROFILE_ASSETS': JSON.stringify(process.env.CANISTER_ID_PROFILE_ASSETS || ''),
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(
          new URL("../declarations", import.meta.url)
        ),
      },
    ],
  },
});
