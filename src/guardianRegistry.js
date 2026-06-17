import { Connection } from "@solana/web3.js";
import {
  decodeGuardianRegion,
  GUARDIAN_REGION_LEN,
  GUARDIAN_STATUS_ACTIVE,
  NICECHUNK_GUARDIAN_PROGRAM_ID,
} from "../sdk/nicechunk-guardian.ts";
import { createNicechunkRpcFetch, getNicechunkRpcUrl, reportRpcError, rpcConfigChangedEventName } from "./rpcConfig.js";

const registryCacheMs = 30000;
const guardianPath = "/ws";

export function createGuardianRegistryResolver({ fallbackUrl = "", rpcUrl = "" } = {}) {
  return new GuardianRegistryResolver({ fallbackUrl, rpcUrl });
}

class GuardianRegistryResolver {
  constructor({ fallbackUrl, rpcUrl }) {
    this.fallbackUrl = fallbackUrl;
    this.rpcUrl = rpcUrl || getNicechunkRpcUrl();
    this.connection = this.createConnection();
    this.guardians = [];
    this.hasLoaded = false;
    this.loadedAt = 0;
    this.loading = null;
    window.addEventListener(rpcConfigChangedEventName, () => {
      if (rpcUrl) return;
      this.rpcUrl = getNicechunkRpcUrl();
      this.connection = this.createConnection();
      this.guardians = [];
      this.hasLoaded = false;
      this.loadedAt = 0;
      this.loading = null;
    });
  }

  createConnection() {
    return new Connection(this.rpcUrl, {
      commitment: "confirmed",
      fetch: createNicechunkRpcFetch("guardian-registry"),
    });
  }

  async resolveForChunk(chunkX, chunkZ) {
    const guardians = await this.loadGuardians();
    const match = guardians
      .filter((guardian) => containsChunk(guardian, chunkX, chunkZ))
      .sort(compareGuardiansForChunk(chunkX, chunkZ))[0];
    if (match) return { url: guardianEndpoint(match), guardian: match, source: "registry" };
    return null;
  }

  async loadGuardians({ force = false } = {}) {
    const now = performance.now();
    if (!force && this.hasLoaded && now - this.loadedAt < registryCacheMs) return this.guardians;
    if (this.loading) return this.loading;
    this.loading = this.fetchGuardians()
      .then((guardians) => {
        this.guardians = guardians;
        this.hasLoaded = true;
        this.loadedAt = performance.now();
        return guardians;
      })
      .finally(() => {
        this.loading = null;
      });
    return this.loading;
  }

  getCachedGuardians() {
    return this.guardians;
  }

  isLoaded() {
    return this.hasLoaded;
  }

  async fetchGuardians() {
    let accounts;
    try {
      accounts = await this.connection.getProgramAccounts(NICECHUNK_GUARDIAN_PROGRAM_ID, {
        commitment: "confirmed",
        filters: [{ dataSize: GUARDIAN_REGION_LEN }],
      });
    } catch (error) {
      reportRpcError(error, "guardian-registry");
      throw error;
    }
    return accounts
      .map(({ pubkey, account }) => {
        try {
          return decodeGuardianRegion(account.data, pubkey);
        } catch {
          return null;
        }
      })
      .filter((guardian) => guardian && guardian.status === GUARDIAN_STATUS_ACTIVE && guardian.host);
  }
}

export function guardianCoversChunk(guardian, chunkX, chunkZ) {
  return guardian ? containsChunk(guardian, chunkX, chunkZ) : false;
}

function containsChunk(guardian, chunkX, chunkZ) {
  return (
    chunkX >= guardian.minChunkX &&
    chunkX <= guardian.maxChunkX &&
    chunkZ >= guardian.minChunkY &&
    chunkZ <= guardian.maxChunkY
  );
}

function compareGuardiansForChunk(chunkX, chunkZ) {
  return (a, b) => {
    const aCenterX = (a.minChunkX + a.maxChunkX) / 2;
    const aCenterZ = (a.minChunkY + a.maxChunkY) / 2;
    const bCenterX = (b.minChunkX + b.maxChunkX) / 2;
    const bCenterZ = (b.minChunkY + b.maxChunkY) / 2;
    const aDistance = Math.abs(aCenterX - chunkX) + Math.abs(aCenterZ - chunkZ);
    const bDistance = Math.abs(bCenterX - chunkX) + Math.abs(bCenterZ - chunkZ);
    return aDistance - bDistance || Number(b.lastProofAt || 0) - Number(a.lastProofAt || 0);
  };
}

function guardianEndpoint(guardian) {
  const scheme = guardian.useTls ? "wss" : "ws";
  return normalizeGuardianEndpoint(`${scheme}://${guardian.host}:${guardian.port}`);
}

function fallbackGuardianEndpoint(url) {
  return normalizeGuardianEndpoint(url);
}

function normalizeGuardianEndpoint(value) {
  const url = new URL(value);
  if (url.pathname === "/" || !url.pathname) url.pathname = guardianPath;
  return url.toString();
}
