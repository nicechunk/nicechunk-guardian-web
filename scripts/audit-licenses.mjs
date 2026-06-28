import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const packagePath = path.join(root, "package.json");
const lockPath = path.join(root, "package-lock.json");

const allowedLicenses = new Set([
  "0BSD",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "BlueOak-1.0.0",
  "CC0-1.0",
  "ISC",
  "MIT",
  "MPL-2.0",
  "Unlicense",
]);

const trackedExceptions = new Map([
  [
    "argparse",
    {
      license: "Python-2.0",
      reason: "Transitive parser utility used by development tooling; Python-2.0 is tracked separately from the standard permissive set.",
    },
  ],
  [
    "eyes",
    {
      license: "UNKNOWN",
      reason: "Legacy transitive dependency of jayson in the Solana web3 stack; no project source imports it directly.",
    },
  ],
  [
    "rpc-websockets",
    {
      license: "LGPL-3.0-only",
      reason: "Transitive runtime dependency of @solana/web3.js; keep as an explicit review item when upgrading Solana packages.",
    },
  ],
  [
    "text-encoding-utf-8",
    {
      license: "UNKNOWN",
      reason: "Small transitive text encoding package in the current dependency graph; no project source imports it directly.",
    },
  ],
]);

const findings = [];
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
const packages = lock.packages ?? {};
const licenseCounts = {};
const exceptions = [];
const dependencies = [];

if (packageJson.license !== "Apache-2.0") findings.push("package.license must be Apache-2.0");
if (packages[""]?.license && packages[""].license !== "Apache-2.0") {
  findings.push("package-lock root license must be Apache-2.0");
}

for (const [pkgPath, meta] of Object.entries(packages)) {
  if (!pkgPath.startsWith("node_modules/")) continue;
  const name = packageNameFromPath(pkgPath);
  const license = String(meta.license || "UNKNOWN");
  dependencies.push({ name, version: meta.version ?? "", license });
  licenseCounts[license] = (licenseCounts[license] ?? 0) + 1;

  if (allowedLicenses.has(license)) continue;

  const exception = trackedExceptions.get(name);
  if (exception?.license === license) {
    exceptions.push({ name, version: meta.version ?? "", license, reason: exception.reason });
    continue;
  }

  findings.push(`${name}@${meta.version ?? "unknown"} has unreviewed license: ${license}`);
}

for (const [name, exception] of trackedExceptions.entries()) {
  if (!dependencies.some((dependency) => dependency.name === name && dependency.license === exception.license)) {
    findings.push(`tracked license exception is stale or mismatched: ${name} (${exception.license})`);
  }
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  package: {
    name: packageJson.name,
    version: packageJson.version,
    license: packageJson.license,
  },
  dependencyCount: dependencies.length,
  allowedLicenseCount: dependencies.length - exceptions.length - findings.length,
  licenseCounts: Object.fromEntries(Object.entries(licenseCounts).sort(([left], [right]) => left.localeCompare(right))),
  trackedExceptions: exceptions.sort((left, right) => left.name.localeCompare(right.name)),
  findings,
  ok: findings.length === 0,
};

console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  console.error("License audit failed.");
  process.exit(1);
}

function packageNameFromPath(pkgPath) {
  const parts = pkgPath.split("/");
  if (parts[1]?.startsWith("@")) return `${parts[1]}/${parts[2]}`;
  return parts[1] ?? pkgPath;
}
