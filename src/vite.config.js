import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy token exchange to avoid CORS in dev (adjust target to your Conga region)
    proxy: {
      "/oauth2/token": {
        target: "https://login.congacloud.com",
        changeOrigin: true,
        secure: true,
      },
      "/v1": {
        target: "https://api.congacloud.com",
        changeOrigin: true,
        secure: true,
        headers: {
          "X-Forwarded-Host": "localhost:3000",
        },
      },
      '/sf-api': {
        target: 'https://test.salesforce.com', // Use 'test' since you are on a Sandbox
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sf-api/, ''),
      }
    },
  },
});
