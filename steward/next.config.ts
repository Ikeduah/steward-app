import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Pin Turbopack's root to this directory. There is a second package-lock.json
  // one level up, and without this Turbopack infers the parent as the project
  // root, watches the wrong tree, and panics on every HMR write with a stale
  // get_pages_structure_for_root_directory cell. That shows up in the browser
  // as the dev server reloading the page in a loop.
  turbopack: {
    root: __dirname,
  },
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
  // Baseline security headers. CSP is intentionally deferred — Next inline
  // scripts + Clerk make a correct policy non-trivial; track as follow-up.
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // SAMEORIGIN (not DENY): the landing page and demos embed the
          // /promos/*.html brand films in same-origin iframes.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            // camera stays allowed for self — the QR scanner (html5-qrcode)
            // in the checkout flow needs it.
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
