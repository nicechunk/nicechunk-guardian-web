import { resolve } from "node:path";
import { defineConfig } from "vite";
import pkg from "./package.json" with { type: "json" };

const buildVersion = `${pkg.version}-${new Date()
  .toISOString()
  .replace(/\D/g, "")
  .slice(0, 14)}`;

function appendAssetVersion() {
  return {
    name: "append-asset-version",
    transformIndexHtml(html) {
      const versionedHtml = html.replace(
        /(src|href)="([^"]+\.(?:js|css))"/g,
        (_match, attr, url) => `${attr}="${url}?v=${buildVersion}"`,
      );
      return versionedHtml.replace(
        /(<link\s+rel="modulepreload"[^>]+href="[^"]+)\?v=[^"]+"/g,
        "$1\"",
      );
    },
  };
}

export default defineConfig({
  plugins: [appendAssetVersion()],
  define: {
    __BUILD_VERSION__: JSON.stringify(buildVersion),
  },
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
      binaryInterval: 3000,
      ignored: [
        "**/.git/**",
        "**/node_modules/**",
        "**/dist/**",
        "**/target/**",
        "**/coverage/**",
      ],
    },
  },
  build: {
    target: "es2022",
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(__dirname, "index.html"),
        play: resolve(__dirname, "play/index.html"),
        login: resolve(__dirname, "login/index.html"),
        docs: resolve(__dirname, "docs/index.html"),
        roadmap: resolve(__dirname, "roadmap/index.html"),
        fairness: resolve(__dirname, "fairness/index.html"),
        player_set: resolve(__dirname, "player_set/index.html"),
        world_rule: resolve(__dirname, "world_rule/index.html"),
        resource_rule: resolve(__dirname, "resource_rule/index.html"),
        elements: resolve(__dirname, "elements/index.html"),
        forging: resolve(__dirname, "forging/index.html"),
        mining: resolve(__dirname, "mining/index.html"),
        guardian: resolve(__dirname, "guardian/index.html"),
        contracts: resolve(__dirname, "contracts/index.html"),
        proof_of_frontier: resolve(__dirname, "proof-of-frontier/index.html"),
      },
    },
  },
});
