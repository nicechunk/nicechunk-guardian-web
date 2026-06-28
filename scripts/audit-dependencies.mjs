import { spawnSync } from "node:child_process";

const allowedVulnerabilities = new Map([
  [
    "bigint-buffer",
    {
      advisoryUrls: new Set(["https://github.com/advisories/GHSA-3gc7-fjrx-p6mg"]),
      reason: "Transitive dependency of @solana/spl-token through @solana/buffer-layout-utils. No non-breaking upstream fix is available in the current Solana package line.",
    },
  ],
  [
    "uuid",
    {
      advisoryUrls: new Set(["https://github.com/advisories/GHSA-w5hq-g745-h8pq"]),
      reason: "Transitive dependency of @solana/web3.js through jayson. npm's suggested fix downgrades @solana/web3.js to an unusable pre-1.x version.",
    },
  ],
]);

const allowedTransitiveNames = new Map([
  ["@solana/buffer-layout-utils", "bigint-buffer"],
  ["@solana/spl-token", "bigint-buffer"],
  ["@solana/spl-token-group", "uuid"],
  ["@solana/spl-token-metadata", "uuid"],
  ["@solana/web3.js", "uuid"],
  ["jayson", "uuid"],
]);

const audit = spawnSync("npm", ["audit", "--json"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (!audit.stdout.trim()) {
  console.error(audit.stderr.trim() || "npm audit produced no JSON output.");
  process.exit(audit.status || 1);
}

let report;
try {
  report = JSON.parse(audit.stdout);
} catch (error) {
  console.error("Failed to parse npm audit JSON output.");
  console.error(error);
  process.exit(1);
}

const vulnerabilities = report.vulnerabilities ?? {};
const unexpected = [];
const allowed = [];

for (const [name, finding] of Object.entries(vulnerabilities)) {
  const directAllowance = allowedVulnerabilities.get(name);
  if (directAllowance && advisoryUrls(finding).every((url) => directAllowance.advisoryUrls.has(url))) {
    allowed.push({ name, severity: finding.severity, reason: directAllowance.reason });
    continue;
  }

  const inheritedAllowance = allowedTransitiveNames.get(name);
  if (inheritedAllowance && vulnerabilities[inheritedAllowance]) {
    allowed.push({
      name,
      severity: finding.severity,
      reason: `Transitive audit finding inherited from allowed ${inheritedAllowance} advisory.`,
    });
    continue;
  }

  unexpected.push({
    name,
    severity: finding.severity,
    via: finding.via,
    fixAvailable: finding.fixAvailable,
  });
}

console.log(JSON.stringify({
  ok: unexpected.length === 0,
  allowed,
  unexpected,
}, null, 2));

if (unexpected.length) {
  console.error("Dependency audit failed: unexpected vulnerabilities were found.");
  process.exit(1);
}

function advisoryUrls(finding) {
  const urls = [];
  for (const item of finding.via ?? []) {
    if (item && typeof item === "object" && typeof item.url === "string") urls.push(item.url);
  }
  return urls;
}
