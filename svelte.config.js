import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import("@sveltejs/kit").Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // Keep the adapter's generated entrypoint separate from the checked-in Worker wrapper.
      config: "wrangler.svelte.jsonc",
      platformProxy: {
        configPath: "wrangler.jsonc",
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
