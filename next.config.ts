import type { NextConfig } from "next";

// URL base do backend, SEM "/docs" e sem barra no final.
// Ex.: https://api-hackathon-ufpa.duckdns.org  ou  http://localhost:8000
// Defina em .env.local (BACKEND_URL) e reinicie o `npm run dev` ao alterar.
const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:8000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Libera acesso do dev server pela rede local (evita bloqueios de HMR)
  allowedDevOrigins: ["26.96.89.0", "localhost:3000"],

  async rewrites() {
    return [
      {
        source: "/api-backend/:path*",
        destination: `${BACKEND_URL}/:path*`, // Proxy transparente para o FastAPI
      },
    ];
  },
};

export default nextConfig;