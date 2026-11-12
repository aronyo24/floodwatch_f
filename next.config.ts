import type { NextConfig } from "next";

/**
 * FLOODWATCH_API_URL points the app at the Django backend. The Next server
 * then forwards /api/, /media/ (overlay PNGs) and /admin/ (+ its /static/) to
 * Django, ahead of the bundled demo route handlers. Django is the default
 * (http://127.0.0.1:8000); the bundled demo data is used only when
 * FLOODWATCH_DEMO=true. The browser only ever
 * talks to this origin, so there is no CORS to configure and the staff session
 * cookie from /admin/ reaches POST /api/update/.
 */
const demoMode = process.env.FLOODWATCH_DEMO === "true";
const backend = demoMode
  ? ""
  : (process.env.FLOODWATCH_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backend) return [];
    return {
      // Every Django route under /api/ and /admin/ ends in "/", but the
      // `:path*` capture drops it, so it is put back - otherwise each request
      // would bounce through Django's APPEND_SLASH redirect.
      beforeFiles: [
        ...["api", "admin"].flatMap((prefix) => [
          { source: `/${prefix}`, destination: `${backend}/${prefix}/` },
          { source: `/${prefix}/:path+`, destination: `${backend}/${prefix}/:path+/` },
        ]),
        ...["media", "static"].map((prefix) => ({
          source: `/${prefix}/:path+`,
          destination: `${backend}/${prefix}/:path+`,
        })),
      ],
      afterFiles: [],
      fallback: [],
    };
  },

  // The Frontend Plan's URL table and the Backend Plan's endpoint list both use
  // trailing slashes (`/explorer/`, `/api/cycles/<date>/`). Making those
  // canonical means the implemented URLs match the documents exactly, and no
  // request pays for a 308 redirect first.
  trailingSlash: true,

  // `cacheComponents` and `partialPrefetching` are left off deliberately. This
  // app reads a JSON file from disk on the server and everything that changes
  // is client-side, so the experimental caching model buys nothing here and
  // would add a failure mode to debug during a hackathon weekend.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
