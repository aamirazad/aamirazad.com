import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import("@sveltejs/kit").Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      platformProxy: {
        configPath: "wrangler.jsonc",
        environment: "preview",
        persist: ".wrangler/state/v3",
      },
    }),
    csp: {
      mode: "auto",
      directives: {
        "default-src": ["self"],
        "base-uri": ["none"],
        "connect-src": ["self"],
        "font-src": ["self"],
        "form-action": ["self"],
        "frame-ancestors": ["none"],
        "img-src": ["self", "data:"],
        "object-src": ["none"],
        "script-src": ["self"],
        "style-src": ["self"],
      },
    },
  },
};

export default config;
