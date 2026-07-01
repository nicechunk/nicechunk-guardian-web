import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { defineConfig } from "vite";
import pkg from "./package.json" with { type: "json" };

const buildVersion = `${pkg.version}-${new Date()
  .toISOString()
  .replace(/\D/g, "")
  .slice(0, 14)}`;

const pageInputs = Object.fromEntries(
  Object.entries({
    home: "index.html",
    play: "play/index.html",
    login: "login/index.html",
    docs: "docs/index.html",
    roadmap: "roadmap/index.html",
    fairness: "fairness/index.html",
    player_set: "player_set/index.html",
    world_rule: "world_rule/index.html",
    resource_rule: "resource_rule/index.html",
    ncm: "ncm/index.html",
    ncfm: "ncfm/index.html",
    ncm_dna: "ncm_dna/index.html",
    fourier_pickaxe: "fourier-pickaxe/index.html",
    fourier_voxel: "fourier-voxel/index.html",
    elements: "elements/index.html",
    forging: "forging/index.html",
    mining: "mining/index.html",
    seed: "seed/index.html",
    chip: "chip/index.html",
    guardian: "guardian/index.html",
    contracts: "contracts/index.html",
    civilization: "civilization/index.html",
    trust: "trust/index.html",
    proof_of_frontier: "proof-of-frontier/index.html",
  })
    .map(([name, path]) => [name, resolve(__dirname, path)])
    .filter(([, path]) => existsSync(path)),
);

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
      input: pageInputs,
      output: {
        manualChunks(id) {
          return id.replaceAll("\\", "/").endsWith("/src/render/resourcePreview.js") ? "resourcePreview" : undefined;
        },
      },
    },
  },
});
