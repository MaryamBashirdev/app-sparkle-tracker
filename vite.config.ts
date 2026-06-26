// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  // Cloudflare's nitro deploy plugin normally auto-enables only inside Lovable's own
  // build context. Cloudflare Workers Builds (Git-connected CI) runs outside that
  // context, so it gets silently skipped — causing the "#tanstack-start-entry" errors.
  // Force it on here regardless of context:
  nitro: true,
  tanstackStart: {
    server: { entry: "server" },
  },
});
