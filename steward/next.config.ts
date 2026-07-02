import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Proxy backend API calls to FastAPI.
  //   Dev  → local uvicorn server (path preserved, including the /api prefix).
  //   Prod → the Vercel Python serverless function (api/index.py), which
  //          receives the full /api/* path. Next.js filesystem routes
  //          (/api/cron/*, /api/ai/*) are matched before these afterFiles
  //          rewrites, so they continue to be served by Next.js.
  rewrites: async () => {
    return {
      afterFiles: [
        {
          source: "/api/:path*",
          destination:
            process.env.NODE_ENV === "development"
              ? "http://127.0.0.1:8000/api/:path*"
              : "/api/",
        },
      ],
    };
  },
};

export default nextConfig;
