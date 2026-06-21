import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  deriveGlobalConfigPda,
  NICECHUNK_CORE_PROGRAM_ID,
} from "./nicechunk-core.ts";

const env = typeof process !== "undefined" ? process.env : {};

export const NICECHUNK_GUARDIAN_PROGRAM_ID = new PublicKey(
  env.NICECHUNK_GUARDIAN_PROGRAM_ID ?? "6frJyJSirfEwsztsxijcJLe29LSaceET1wanXSFwPQyE",
);
export const DEVNET_NCK_MINT = new PublicKey(
  env.NCK_MINT ?? "HSnWF5kjkWVrceW2SaSskScuLveUZE4gpthZ2ZXRPQPo",
);
export const GUARDIAN_REGISTRY_SEED = "guardian-registry";
export const GUARDIAN_REGION_SEED = "guardian-region";
export const GUARDIAN_TREASURY_AUTHORITY_SEED = "guardian-treasury";
export const GUARDIAN_REGISTRY_LEN = 160;
export const GUARDIAN_REGION_LEN = 256;
export const GUARDIAN_REGISTRY_MAGIC = "NCKGDR01";
export const GUARDIAN_REGION_MAGIC = "NCKGRG01";
export const GUARDIAN_REGION_SIZE = 100;
export const GUARDIAN_STAKE_AMOUNT = 100_000_000_000n;
export const GUARDIAN_STATUS_ACTIVE = 1;
export const GUARDIAN_STATUS_REMOVED = 2;

export interface DecodedGuardianRegistry {
  magic: string;
  version: number;
  bump: number;
  treasuryBump: number;
  globalConfig: PublicKey;
  nckMint: PublicKey;
  treasuryToken: PublicKey;
  activeCount: bigint;
  totalRegistrations: bigint;
  genesisRegistered: boolean;
  regionSizeChunks: number;
  stakeAmount: bigint;
  slashAmount: bigint;
  createdSlot: bigint;
  createdAt: bigint;
}

export interface DecodedGuardianRegion {
  publicKey?: PublicKey;
  magic: string;
  version: number;
  bump: number;
  status: number;
  regionX: number;
  regionY: number;
  minChunkX: number;
  minChunkY: number;
  maxChunkX: number;
  maxChunkY: number;
  owner: PublicKey;
  operator: PublicKey;
  globalConfig: PublicKey;
  host: string;
  port: number;
  useTls: boolean;
  stakeAmount: bigint;
  totalSlashed: bigint;
  penaltyCount: number;
  registeredAt: bigint;
  lastProofAt: bigint;
  penaltyCursorAt: bigint;
  proofCount: bigint;
  updatedSlot: number;
}

export function chunkToGuardianRegion(chunkCoord: number): number {
  return Math.floor(chunkCoord / GUARDIAN_REGION_SIZE);
}

export function deriveGuardianRegistryPda({
  globalConfig,
  programId = NICECHUNK_GUARDIAN_PROGRAM_ID,
}: {
  globalConfig: PublicKey;
  programId?: PublicKey;
}): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(GUARDIAN_REGISTRY_SEED), globalConfig.toBuffer()],
    programId,
  );
}

export function deriveGuardianTreasuryAuthorityPda({
  globalConfig,
  programId = NICECHUNK_GUARDIAN_PROGRAM_ID,
}: {
  globalConfig: PublicKey;
  programId?: PublicKey;
}): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(GUARDIAN_TREASURY_AUTHORITY_SEED), globalConfig.toBuffer()],
    programId,
  );
}

export function deriveGuardianRegionPda({
  globalConfig,
  regionX,
  regionY,
  programId = NICECHUNK_GUARDIAN_PROGRAM_ID,
}: {
  globalConfig: PublicKey;
  regionX: number;
  regionY: number;
  programId?: PublicKey;
}): [PublicKey, number] {
  const x = Buffer.alloc(4);
  const y = Buffer.alloc(4);
  x.writeInt32LE(regionX, 0);
  y.writeInt32LE(regionY, 0);
  return PublicKey.findProgramAddressSync(
    [Buffer.from(GUARDIAN_REGION_SEED), globalConfig.toBuffer(), x, y],
    programId,
  );
}

export function deriveNeighborGuardianRegions({
  globalConfig,
  regionX,
  regionY,
  programId = NICECHUNK_GUARDIAN_PROGRAM_ID,
}: {
  globalConfig: PublicKey;
  regionX: number;
  regionY: number;
  programId?: PublicKey;
}): PublicKey[] {
  return [
    deriveGuardianRegionPda({ globalConfig, regionX: regionX + 1, regionY, programId })[0],
    deriveGuardianRegionPda({ globalConfig, regionX: regionX - 1, regionY, programId })[0],
    deriveGuardianRegionPda({ globalConfig, regionX, regionY: regionY + 1, programId })[0],
    deriveGuardianRegionPda({ globalConfig, regionX, regionY: regionY - 1, programId })[0],
  ];
}

export function createInitializeGuardianRegistryInstruction({
  payer,
  treasuryNckToken,
  guardianProgramId = NICECHUNK_GUARDIAN_PROGRAM_ID,
  coreProgramId = NICECHUNK_CORE_PROGRAM_ID,
  nckMint = DEVNET_NCK_MINT,
}: {
  payer: PublicKey;
  treasuryNckToken: PublicKey;
  guardianProgramId?: PublicKey;
  coreProgramId?: PublicKey;
  nckMint?: PublicKey;
}): TransactionInstruction {
  const [globalConfig] = deriveGlobalConfigPda(coreProgramId);
  const [registry] = deriveGuardianRegistryPda({ globalConfig, programId: guardianProgramId });
  const [treasuryAuthority] = deriveGuardianTreasuryAuthorityPda({
    globalConfig,
    programId: guardianProgramId,
  });
  return new TransactionInstruction({
    programId: guardianProgramId,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: registry, isSigner: false, isWritable: true },
      { pubkey: globalConfig, isSigner: false, isWritable: false },
      { pubkey: treasuryAuthority, isSigner: false, isWritable: false },
      { pubkey: treasuryNckToken, isSigner: false, isWritable: false },
      { pubkey: nckMint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([0]),
  });
}

export function createRegisterGuardianInstruction({
  payer,
  owner,
  ownerNckToken,
  treasuryNckToken,
  regionX,
  regionY,
  host,
  port,
  useTls,
  operator,
  isGenesis = false,
  guardianProgramId = NICECHUNK_GUARDIAN_PROGRAM_ID,
  coreProgramId = NICECHUNK_CORE_PROGRAM_ID,
  nckMint = DEVNET_NCK_MINT,
}: {
  payer: PublicKey;
  owner: PublicKey;
  ownerNckToken: PublicKey;
  treasuryNckToken: PublicKey;
  regionX: number;
  regionY: number;
  host: string;
  port: number;
  useTls: boolean;
  operator: PublicKey;
  isGenesis?: boolean;
  guardianProgramId?: PublicKey;
  coreProgramId?: PublicKey;
  nckMint?: PublicKey;
}): TransactionInstruction {
  const [globalConfig] = deriveGlobalConfigPda(coreProgramId);
  const [registry] = deriveGuardianRegistryPda({ globalConfig, programId: guardianProgramId });
  const [region] = deriveGuardianRegionPda({ globalConfig, regionX, regionY, programId: guardianProgramId });
  const [treasuryAuthority] = deriveGuardianTreasuryAuthorityPda({
    globalConfig,
    programId: guardianProgramId,
  });
  const hostBytes = Buffer.from(host, "utf8");
  if (hostBytes.length === 0 || hostBytes.length > 64) {
    throw new Error("Guardian host must be 1-64 bytes");
  }
  const data = Buffer.alloc(1 + 12 + hostBytes.length + 32);
  data.writeUInt8(isGenesis ? 1 : 2, 0);
  data.writeInt32LE(regionX, 1);
  data.writeInt32LE(regionY, 5);
  data.writeUInt16LE(port, 9);
  data.writeUInt8(useTls ? 1 : 0, 11);
  data.writeUInt8(hostBytes.length, 12);
  hostBytes.copy(data, 13);
  operator.toBuffer().copy(data, 13 + hostBytes.length);

  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: false },
    { pubkey: ownerNckToken, isSigner: false, isWritable: true },
    { pubkey: registry, isSigner: false, isWritable: true },
    { pubkey: region, isSigner: false, isWritable: true },
    { pubkey: globalConfig, isSigner: false, isWritable: false },
    { pubkey: treasuryAuthority, isSigner: false, isWritable: false },
    { pubkey: treasuryNckToken, isSigner: false, isWritable: true },
    { pubkey: nckMint, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  if (!isGenesis) {
    keys.push(
      ...deriveNeighborGuardianRegions({ globalConfig, regionX, regionY, programId: guardianProgramId }).map((pubkey) => ({
        pubkey,
        isSigner: false,
        isWritable: false,
      })),
    );
  }

  return new TransactionInstruction({
    programId: guardianProgramId,
    keys,
    data,
  });
}

export function createSubmitGuardianProofInstruction({
  operator,
  regionX,
  regionY,
  guardianProgramId = NICECHUNK_GUARDIAN_PROGRAM_ID,
  coreProgramId = NICECHUNK_CORE_PROGRAM_ID,
}: {
  operator: PublicKey;
  regionX: number;
  regionY: number;
  guardianProgramId?: PublicKey;
  coreProgramId?: PublicKey;
}): TransactionInstruction {
  const [globalConfig] = deriveGlobalConfigPda(coreProgramId);
  const [registry] = deriveGuardianRegistryPda({ globalConfig, programId: guardianProgramId });
  const [region] = deriveGuardianRegionPda({ globalConfig, regionX, regionY, programId: guardianProgramId });
  const data = Buffer.alloc(9);
  data.writeUInt8(3, 0);
  data.writeInt32LE(regionX, 1);
  data.writeInt32LE(regionY, 5);
  return new TransactionInstruction({
    programId: guardianProgramId,
    keys: [
      { pubkey: operator, isSigner: true, isWritable: false },
      { pubkey: registry, isSigner: false, isWritable: true },
      { pubkey: region, isSigner: false, isWritable: true },
      { pubkey: globalConfig, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export function createSettleGuardianInstruction({
  regionX,
  regionY,
  guardianProgramId = NICECHUNK_GUARDIAN_PROGRAM_ID,
  coreProgramId = NICECHUNK_CORE_PROGRAM_ID,
}: {
  regionX: number;
  regionY: number;
  guardianProgramId?: PublicKey;
  coreProgramId?: PublicKey;
}): TransactionInstruction {
  const [globalConfig] = deriveGlobalConfigPda(coreProgramId);
  const [registry] = deriveGuardianRegistryPda({ globalConfig, programId: guardianProgramId });
  const [region] = deriveGuardianRegionPda({ globalConfig, regionX, regionY, programId: guardianProgramId });
  const data = Buffer.alloc(9);
  data.writeUInt8(4, 0);
  data.writeInt32LE(regionX, 1);
  data.writeInt32LE(regionY, 5);
  return new TransactionInstruction({
    programId: guardianProgramId,
    keys: [
      { pubkey: registry, isSigner: false, isWritable: true },
      { pubkey: region, isSigner: false, isWritable: true },
      { pubkey: globalConfig, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export function createUpdateGuardianEndpointInstruction({
  owner,
  regionX,
  regionY,
  host,
  port,
  useTls,
  guardianProgramId = NICECHUNK_GUARDIAN_PROGRAM_ID,
  coreProgramId = NICECHUNK_CORE_PROGRAM_ID,
}: {
  owner: PublicKey;
  regionX: number;
  regionY: number;
  host: string;
  port: number;
  useTls: boolean;
  guardianProgramId?: PublicKey;
  coreProgramId?: PublicKey;
}): TransactionInstruction {
  const [globalConfig] = deriveGlobalConfigPda(coreProgramId);
  const [registry] = deriveGuardianRegistryPda({ globalConfig, programId: guardianProgramId });
  const [region] = deriveGuardianRegionPda({ globalConfig, regionX, regionY, programId: guardianProgramId });
  const hostBytes = Buffer.from(host, "utf8");
  if (hostBytes.length === 0 || hostBytes.length > 64) {
    throw new Error("Guardian host must be 1-64 bytes");
  }
  const data = Buffer.alloc(13 + hostBytes.length);
  data.writeUInt8(5, 0);
  data.writeInt32LE(regionX, 1);
  data.writeInt32LE(regionY, 5);
  data.writeUInt16LE(port, 9);
  data.writeUInt8(useTls ? 1 : 0, 11);
  data.writeUInt8(hostBytes.length, 12);
  hostBytes.copy(data, 13);

  return new TransactionInstruction({
    programId: guardianProgramId,
    keys: [
      { pubkey: owner, isSigner: true, isWritable: false },
      { pubkey: registry, isSigner: false, isWritable: false },
      { pubkey: region, isSigner: false, isWritable: true },
      { pubkey: globalConfig, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export function decodeGuardianRegistry(data: Buffer): DecodedGuardianRegistry {
  if (data.length !== GUARDIAN_REGISTRY_LEN) {
    throw new Error(`Invalid GuardianRegistry length: expected ${GUARDIAN_REGISTRY_LEN}, got ${data.length}`);
  }
  let offset = 0;
  const bytes = (length: number): Buffer => {
    const value = data.subarray(offset, offset + length);
    offset += length;
    return value;
  };
  const u8 = () => data.readUInt8(offset++);
  const u16 = () => {
    const value = data.readUInt16LE(offset);
    offset += 2;
    return value;
  };
  const u64 = () => {
    const value = data.readBigUInt64LE(offset);
    offset += 8;
    return value;
  };
  const i64 = () => {
    const value = data.readBigInt64LE(offset);
    offset += 8;
    return value;
  };
  const pubkey = () => new PublicKey(bytes(32));
  const decoded = {
    magic: bytes(8).toString("utf8"),
    version: u16(),
    bump: u8(),
    treasuryBump: u8(),
    globalConfig: pubkey(),
    nckMint: pubkey(),
    treasuryToken: pubkey(),
    activeCount: u64(),
    totalRegistrations: u64(),
    genesisRegistered: u8() === 1,
    _reserved: u8(),
    regionSizeChunks: u16(),
    stakeAmount: u64(),
    slashAmount: u64(),
    createdSlot: u64(),
    createdAt: i64(),
  };
  if (decoded.magic !== GUARDIAN_REGISTRY_MAGIC || offset !== GUARDIAN_REGISTRY_LEN) {
    throw new Error("Invalid GuardianRegistry data");
  }
  const { _reserved, ...result } = decoded;
  return result;
}

export function decodeGuardianRegion(data: Buffer, publicKey?: PublicKey): DecodedGuardianRegion {
  if (data.length !== GUARDIAN_REGION_LEN) {
    throw new Error(`Invalid GuardianRegion length: expected ${GUARDIAN_REGION_LEN}, got ${data.length}`);
  }
  let offset = 0;
  const bytes = (length: number): Buffer => {
    const value = data.subarray(offset, offset + length);
    offset += length;
    return value;
  };
  const u8 = () => data.readUInt8(offset++);
  const u16 = () => {
    const value = data.readUInt16LE(offset);
    offset += 2;
    return value;
  };
  const u32 = () => {
    const value = data.readUInt32LE(offset);
    offset += 4;
    return value;
  };
  const u64 = () => {
    const value = data.readBigUInt64LE(offset);
    offset += 8;
    return value;
  };
  const i32 = () => {
    const value = data.readInt32LE(offset);
    offset += 4;
    return value;
  };
  const i64 = () => {
    const value = data.readBigInt64LE(offset);
    offset += 8;
    return value;
  };
  const pubkey = () => new PublicKey(bytes(32));

  const decoded: DecodedGuardianRegion = {
    publicKey,
    magic: bytes(8).toString("utf8"),
    version: u16(),
    bump: u8(),
    status: u8(),
    regionX: i32(),
    regionY: i32(),
    minChunkX: i32(),
    minChunkY: i32(),
    maxChunkX: i32(),
    maxChunkY: i32(),
    owner: pubkey(),
    operator: pubkey(),
    globalConfig: pubkey(),
    host: "",
    port: 0,
    useTls: false,
    stakeAmount: 0n,
    totalSlashed: 0n,
    penaltyCount: 0,
    registeredAt: 0n,
    lastProofAt: 0n,
    penaltyCursorAt: 0n,
    proofCount: 0n,
    updatedSlot: 0,
  };
  const hostLen = u8();
  decoded.host = bytes(64).subarray(0, hostLen).toString("utf8");
  decoded.port = u16();
  decoded.useTls = u8() === 1;
  decoded.stakeAmount = u64();
  decoded.totalSlashed = u64();
  decoded.penaltyCount = u32();
  decoded.registeredAt = i64();
  decoded.lastProofAt = i64();
  decoded.penaltyCursorAt = i64();
  decoded.proofCount = u64();
  decoded.updatedSlot = u32();

  if (decoded.magic !== GUARDIAN_REGION_MAGIC || offset !== GUARDIAN_REGION_LEN) {
    throw new Error("Invalid GuardianRegion data");
  }
  return decoded;
}

export function bigintJsonReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}
