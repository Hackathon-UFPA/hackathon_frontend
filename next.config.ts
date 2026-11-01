import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Libera acesso do dev server pela rede local (evita bloqueios de HMR)
  allowedDevOrigins: ["26.96.89.0", "localhost:3000"],

  async rewrites() {
    return [
      {
        source: "/api-backend/:path*",
        destination: "http://localhost:8000/:path*", // Proxy transparente para o FastAPI
      },
    ];
  },
};

export default nextConfig;