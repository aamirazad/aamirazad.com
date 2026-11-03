import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const analyticsOrigin = "https://analytics.aamirazad.com";

/** @type {import("@sveltejs/kit").Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      runtime: "nodejs24.x",
      // Run next to the Neon database (us-east-1) so each query is a short round trip.
      regions: ["iad1"],
    }),
    csp: {
      mode: "auto",
      directives: {
        "default-src": ["self"],
        "base-uri": ["none"],
        "connect-src": ["self", analyticsOrigin],
        "font-src": ["self"],
        "form-action": ["self"],
        "frame-ancestors": ["none"],
        "img-src": ["self", "data:"],
        "object-src": ["none"],
        "script-src": ["self", analyticsOrigin],
        "style-src": ["self"],
      },
    },
  },
};

export default config;
