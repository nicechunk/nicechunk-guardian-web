export const DEFAULT_NICECHUNK_GUARDIAN_URL = "wss://guardian.101.32.242.209.sslip.io/ws";
const LEGACY_NICECHUNK_GUARDIAN_URLS = new Set([
  "ws://101.32.242.209:8080/ws",
  "wss://nicechunk.com/guardian-ws",
]);

const MSG_HELLO = 0x01;
const MSG_HELLO_ACK = 0x02;
const MSG_ERROR = 0x03;
const MSG_PING = 0x04;
const MSG_PONG = 0x05;
const MSG_MOVE = 0x10;
const MSG_MOVE_BATCH = 0x11;
const MSG_DIG = 0x20;
const MSG_DIG_EVENT = 0x21;
const MSG_PLAYER_JOIN = 0x30;
const MSG_PLAYER_LEAVE = 0x31;
const MSG_CHAT = 0x40;
const MSG_CHAT_EVENT = 0x41;

const PROTOCOL_VERSION = 1;
const CHUNK_INDEX_MODE_U8 = 1;
const HELLO_SIZE = 52;
const HELLO_ACK_SIZE = 20;
const MOVE_SIZE = 13;
const MOVE_ITEM_SIZE = 12;
const DIG_SIZE = 11;
const DIG_EVENT_SIZE = 14;
const PLAYER_JOIN_SIZE = 25;
const PLAYER_JOIN_V1_SIZE = 17;
const LEGACY_PLAYER_JOIN_SIZE = 13;
const PLAYER_LEAVE_SIZE = 16;
const PLAYER_LEAVE_V1_SIZE = 8;
const LEGACY_PLAYER_LEAVE_SIZE = 4;
const CHAT_HEADER_SIZE = 4;
const CHAT_EVENT_HEADER_SIZE = 6;
const MAX_CHAT_BYTES = 120;
const DEFAULT_SERVICE_RADIUS_CHUNKS = 100;
const DEFAULT_GUARDIAN_CENTER_CHUNK_X = 0;
const DEFAULT_GUARDIAN_CENTER_CHUNK_Z = 0;
const DEFAULT_POSITION_PRECISION = 64;
const DEFAULT_MOVE_HZ = 20;
const guardianSessionSpawnStorageKey = "nicechunk.guardian.spawnedSession";
const guardianUrlStorageKey = "nicechunk.guardian.url";
const chatTextEncoder = new TextEncoder();
const chatTextDecoder = new TextDecoder();
const base58Alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const base58Lookup = new Map([...base58Alphabet].map((char, index) => [char, index]));

export function resolveNiceChunkGuardianUrl(defaultUrl = DEFAULT_NICECHUNK_GUARDIAN_URL) {
  const queryUrl = guardianUrlFromQuery();
  if (queryUrl) return queryUrl;
  const storedUrl = localStorage.getItem(guardianUrlStorageKey);
  if (storedUrl && !LEGACY_NICECHUNK_GUARDIAN_URLS.has(storedUrl)) return storedUrl;
  if (storedUrl && LEGACY_NICECHUNK_GUARDIAN_URLS.has(storedUrl)) localStorage.setItem(guardianUrlStorageKey, defaultUrl);
  return window.NICECHUNK_GUARDIAN_URL || defaultUrl;
}

export function shouldUseGuardianSpawnForSession(session) {
  if (localStorage.getItem("nicechunk.guardian.spawn") === "0") return false;
  const sessionId = guardianSessionId(session);
  return Boolean(sessionId && localStorage.getItem(guardianSessionSpawnStorageKey) !== sessionId);
}

export function markGuardianSpawnForSession(session) {
  const sessionId = guardianSessionId(session);
  if (sessionId) localStorage.setItem(guardianSessionSpawnStorageKey, sessionId);
}

export function getNiceChunkGuardianSpawnState({
  chunkSize,
  surfaceHeight,
  centerChunkX = DEFAULT_GUARDIAN_CENTER_CHUNK_X,
  centerChunkZ = DEFAULT_GUARDIAN_CENTER_CHUNK_Z,
} = {}) {
  const x = centerChunkX * chunkSize;
  const z = centerChunkZ * chunkSize;
  const y = surfaceHeight(x, z) + 1.01;
  return {
    position: { x, y, z },
    yaw: Math.PI * 0.25,
    cameraPitch: -0.42,
  };
}

export function createNiceChunkGuardianClient(options = {}) {
  return new NiceChunkGuardianClient(options);
}

class NiceChunkGuardianClient {
  constructor(options = {}) {
    this.url = options.url || resolveNiceChunkGuardianUrl();
    this.chunkSize = options.chunkSize || 16;
    this.positionPrecision = options.positionPrecision || DEFAULT_POSITION_PRECISION;
    this.moveIntervalMs = 1000 / (options.moveHz || DEFAULT_MOVE_HZ);
    this.centerChunkX = options.centerChunkX ?? DEFAULT_GUARDIAN_CENTER_CHUNK_X;
    this.centerChunkZ = options.centerChunkZ ?? DEFAULT_GUARDIAN_CENTER_CHUNK_Z;
    this.serviceRadiusChunks = options.serviceRadiusChunks ?? DEFAULT_SERVICE_RADIUS_CHUNKS;
    this.identityHint = options.walletAddress || "";
    this.onReady = options.onReady || (() => {});
    this.onClose = options.onClose || (() => {});
    this.onError = options.onError || (() => {});
    this.onPlayerJoin = options.onPlayerJoin || (() => {});
    this.onPlayerMove = options.onPlayerMove || (() => {});
    this.onPlayerLeave = options.onPlayerLeave || (() => {});
    this.onDig = options.onDig || (() => {});
    this.onChat = options.onChat || (() => {});
    this.onProtocolError = options.onProtocolError || (() => {});
    this.autoReconnect = options.autoReconnect !== false;
    this.reconnectDelayMs = 1000;
    this.maxReconnectDelayMs = options.maxReconnectDelayMs || 12000;
    this.socket = null;
    this.ready = false;
    this.closedByClient = false;
    this.localPlayerId = 0;
    this.serverTick = 0;
    this.clientTick = 0;
    this.digSeq = 0;
    this.chatSeq = 0;
    this.lastMoveSentAt = 0;
    this.lastMovePoseKey = "";
    this.reconnectTimer = null;
  }

  connect({ position } = {}) {
    if (!this.identityHint) {
      this.onProtocolError({ code: 2 });
      return;
    }
    this.closedByClient = false;
    window.clearTimeout(this.reconnectTimer);
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;

    const socket = new WebSocket(this.url);
    this.socket = socket;
    socket.binaryType = "arraybuffer";
    socket.addEventListener("open", () => {
      this.reconnectDelayMs = 1000;
      socket.send(this.encodeHello(position));
    });
    socket.addEventListener("message", (event) => this.handleSocketMessage(event.data));
    socket.addEventListener("error", (event) => this.onError(event));
    socket.addEventListener("close", (event) => {
      if (socket !== this.socket) return;
      this.ready = false;
      this.socket = null;
      this.localPlayerId = 0;
      this.lastMovePoseKey = "";
      this.onClose(event);
      if (this.autoReconnect && !this.closedByClient) this.scheduleReconnect(position);
    });
  }

  reconnectTo(url, { position } = {}) {
    if (!url || url === this.url) {
      this.connect({ position });
      return false;
    }
    const previousSocket = this.socket;
    this.closedByClient = true;
    this.socket = null;
    this.ready = false;
    this.localPlayerId = 0;
    this.lastMovePoseKey = "";
    if (previousSocket && previousSocket.readyState <= WebSocket.OPEN) previousSocket.close();
    this.url = url;
    this.closedByClient = false;
    this.connect({ position });
    return true;
  }

  getUrl() {
    return this.url;
  }

  disconnect() {
    this.closedByClient = true;
    window.clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = null;
    this.ready = false;
    this.lastMovePoseKey = "";
  }

  updateLocalPlayer({ x, y, z, yaw = 0, pitch = 0 }, now = performance.now()) {
    if (!this.ready || !this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    if (now - this.lastMoveSentAt < this.moveIntervalMs) return;

    const poseKey = this.encodeMovePoseKey({ x, y, z, yaw, pitch });
    if (poseKey === this.lastMovePoseKey) return;

    const move = this.encodeMove({ x, y, z, yaw, pitch });
    this.lastMovePoseKey = poseKey;
    this.lastMoveSentAt = now;
    this.socket.send(move.buffer);
  }

  sendDig({ x, y, z, action = 1, toolHint = 0 }) {
    if (!this.ready || !this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    const packet = this.encodeDig({ x, y, z, action, toolHint });
    this.socket.send(packet.buffer);
  }

  sendChat(message) {
    if (!this.ready || !this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    const packet = this.encodeChat(message);
    if (!packet) return false;
    this.socket.send(packet.buffer);
    return true;
  }

  getLocalPlayerId() {
    return this.localPlayerId;
  }

  isReady() {
    return this.ready;
  }

  scheduleReconnect(position) {
    const delay = this.reconnectDelayMs;
    this.reconnectDelayMs = Math.min(this.maxReconnectDelayMs, Math.round(this.reconnectDelayMs * 1.75));
    this.reconnectTimer = window.setTimeout(() => this.connect({ position }), delay);
  }

  async handleSocketMessage(data) {
    const buffer = data instanceof ArrayBuffer ? data : await data.arrayBuffer();
    const view = new DataView(buffer);
    if (view.byteLength < 1) return;

    switch (view.getUint8(0)) {
      case MSG_HELLO_ACK:
        this.decodeHelloAck(view);
        break;
      case MSG_PING:
        this.sendPong();
        break;
      case MSG_ERROR:
        this.onProtocolError(this.decodeError(view));
        break;
      case MSG_MOVE_BATCH:
        this.decodeMoveBatch(view);
        break;
      case MSG_DIG_EVENT:
        this.decodeDigEvent(view);
        break;
      case MSG_PLAYER_JOIN:
        this.decodePlayerJoin(view);
        break;
      case MSG_PLAYER_LEAVE:
        this.decodePlayerLeave(view);
        break;
      case MSG_CHAT_EVENT:
        this.decodeChatEvent(view);
        break;
      default:
        this.onProtocolError({ code: 1 });
        break;
    }
  }

  encodeHello(position) {
    const chunk = this.worldToChunk(position?.x ?? 0, position?.z ?? 0);
    const bytes = new Uint8Array(HELLO_SIZE);
    const view = new DataView(bytes.buffer);
    view.setUint8(0, MSG_HELLO);
    view.setUint8(1, PROTOCOL_VERSION);
    view.setUint16(2, 0, true);
    this.writeWalletHint(bytes, 4);
    view.setInt32(36, chunk.x, true);
    view.setInt32(40, chunk.z, true);
    const nonce = randomNonceWords();
    view.setUint32(44, nonce.low, true);
    view.setUint32(48, nonce.high, true);
    return bytes.buffer;
  }

  encodeMove({ x, y, z, yaw, pitch }) {
    const chunk = this.worldToChunk(x, z);
    const local = this.globalToLocalChunk(chunk.x, chunk.z);
    const offsetX = x - chunk.x * this.chunkSize;
    const offsetZ = z - chunk.z * this.chunkSize;
    const bytes = new Uint8Array(MOVE_SIZE);
    const view = new DataView(bytes.buffer);
    view.setUint8(0, MSG_MOVE);
    view.setUint8(1, clampByte(local.x));
    view.setUint8(2, clampByte(local.z));
    view.setUint16(3, clampU16(Math.round(offsetX * this.positionPrecision)), true);
    view.setUint16(5, clampU16(Math.round(y * this.positionPrecision)), true);
    view.setUint16(7, clampU16(Math.round(offsetZ * this.positionPrecision)), true);
    view.setUint8(9, encodeYaw(yaw));
    view.setInt8(10, encodePitch(pitch));
    view.setUint16(11, ++this.clientTick & 0xffff, true);
    return bytes;
  }

  encodeMovePoseKey({ x, y, z, yaw, pitch }) {
    const chunk = this.worldToChunk(x, z);
    const local = this.globalToLocalChunk(chunk.x, chunk.z);
    const offsetX = x - chunk.x * this.chunkSize;
    const offsetZ = z - chunk.z * this.chunkSize;
    return [
      clampByte(local.x),
      clampByte(local.z),
      clampU16(Math.round(offsetX * this.positionPrecision)),
      clampU16(Math.round(y * this.positionPrecision)),
      clampU16(Math.round(offsetZ * this.positionPrecision)),
      encodeYaw(yaw),
      encodePitch(pitch),
    ].join(":");
  }

  encodeDig({ x, y, z, action, toolHint }) {
    const chunk = this.worldToChunk(x, z);
    const local = this.globalToLocalChunk(chunk.x, chunk.z);
    const blockX = Math.floor(x - chunk.x * this.chunkSize);
    const blockZ = Math.floor(z - chunk.z * this.chunkSize);
    const bytes = new Uint8Array(DIG_SIZE);
    const view = new DataView(bytes.buffer);
    view.setUint8(0, MSG_DIG);
    view.setUint16(1, ++this.digSeq & 0xffff, true);
    view.setUint8(3, clampByte(local.x));
    view.setUint8(4, clampByte(local.z));
    view.setUint8(5, clampByte(blockX));
    view.setUint16(6, clampU16(Math.floor(y)), true);
    view.setUint8(8, clampByte(blockZ));
    view.setUint8(9, clampByte(action));
    view.setUint8(10, clampByte(toolHint));
    return bytes;
  }

  encodeChat(message) {
    const textBytes = chatTextBytes(message);
    if (!textBytes.length) return null;
    const bytes = new Uint8Array(CHAT_HEADER_SIZE + textBytes.length);
    const view = new DataView(bytes.buffer);
    view.setUint8(0, MSG_CHAT);
    view.setUint16(1, ++this.chatSeq & 0xffff, true);
    view.setUint8(3, textBytes.length);
    bytes.set(textBytes, CHAT_HEADER_SIZE);
    return bytes;
  }

  decodeHelloAck(view) {
    if (view.byteLength !== HELLO_ACK_SIZE) {
      this.onProtocolError({ code: 4 });
      return;
    }
    const protocolVersion = view.getUint8(1);
    const chunkIndexMode = view.getUint8(17);
    if (protocolVersion !== PROTOCOL_VERSION || chunkIndexMode !== CHUNK_INDEX_MODE_U8) {
      this.onProtocolError({ code: 8 });
      this.socket?.close();
      return;
    }
    this.localPlayerId = view.getUint16(2, true);
    this.centerChunkX = view.getInt32(6, true);
    this.centerChunkZ = view.getInt32(10, true);
    this.serviceRadiusChunks = view.getUint16(14, true);
    this.serverTick = view.getUint16(18, true);
    this.ready = true;
    this.lastMovePoseKey = "";
    this.onReady({
      localPlayerId: this.localPlayerId,
      centerChunkX: this.centerChunkX,
      centerChunkZ: this.centerChunkZ,
      serviceRadiusChunks: this.serviceRadiusChunks,
      aoiRadiusChunks: view.getUint8(16),
    });
  }

  decodeError(view) {
    return {
      code: view.byteLength >= 3 ? view.getUint16(1, true) : 1,
    };
  }

  decodeMoveBatch(view) {
    if (view.byteLength < 4) return;
    this.serverTick = view.getUint16(1, true);
    const count = view.getUint8(3);
    const expectedLength = 4 + count * MOVE_ITEM_SIZE;
    if (view.byteLength !== expectedLength) {
      this.onProtocolError({ code: 4 });
      return;
    }
    let offset = 4;
    for (let i = 0; i < count; i++) {
      const player = this.decodeMoveItem(view, offset);
      offset += MOVE_ITEM_SIZE;
      if (player.localPlayerId === this.localPlayerId) continue;
      this.onPlayerMove(player);
    }
  }

  decodeMoveItem(view, offset) {
    return this.decodePlayerPose({
      localPlayerId: view.getUint16(offset, true),
      localChunkX: view.getUint8(offset + 2),
      localChunkZ: view.getUint8(offset + 3),
      posX: view.getUint16(offset + 4, true),
      posY: view.getUint16(offset + 6, true),
      posZ: view.getUint16(offset + 8, true),
      yaw: view.getUint8(offset + 10),
      pitch: view.getInt8(offset + 11),
    });
  }

  decodeDigEvent(view) {
    if (view.byteLength !== DIG_EVENT_SIZE) {
      this.onProtocolError({ code: 4 });
      return;
    }
    const localPlayerId = view.getUint16(1, true);
    if (localPlayerId === this.localPlayerId) return;
    const localChunkX = view.getUint8(5);
    const localChunkZ = view.getUint8(6);
    const chunkX = this.localToGlobalChunkX(localChunkX);
    const chunkZ = this.localToGlobalChunkZ(localChunkZ);
    this.onDig({
      localPlayerId,
      seq: view.getUint16(3, true),
      chunkX,
      chunkZ,
      x: chunkX * this.chunkSize + view.getUint8(7),
      y: view.getUint16(8, true),
      z: chunkZ * this.chunkSize + view.getUint8(10),
      action: view.getUint8(11),
      serverTick: view.getUint16(12, true),
    });
  }

  decodePlayerJoin(view) {
    if (view.byteLength !== PLAYER_JOIN_SIZE && view.byteLength !== PLAYER_JOIN_V1_SIZE && view.byteLength !== LEGACY_PLAYER_JOIN_SIZE) {
      this.onProtocolError({ code: 4 });
      return;
    }
    const hasOwnerKey = view.byteLength === PLAYER_JOIN_SIZE;
    const hasOwnerHash = view.byteLength === PLAYER_JOIN_SIZE || view.byteLength === PLAYER_JOIN_V1_SIZE;
    const poseOffset = hasOwnerKey ? 15 : hasOwnerHash ? 7 : 3;
    const player = this.decodePlayerPose({
      localPlayerId: view.getUint16(1, true),
      ownerHash: hasOwnerHash ? view.getUint32(3, true) : 0,
      ownerKey: hasOwnerKey ? readU64Key(view, 7) : "",
      localChunkX: view.getUint8(poseOffset),
      localChunkZ: view.getUint8(poseOffset + 1),
      posX: view.getUint16(poseOffset + 2, true),
      posY: view.getUint16(poseOffset + 4, true),
      posZ: view.getUint16(poseOffset + 6, true),
      yaw: view.getUint8(poseOffset + 8),
      pitch: view.getInt8(poseOffset + 9),
    });
    if (player.localPlayerId === this.localPlayerId) return;
    this.onPlayerJoin(player);
  }

  decodePlayerLeave(view) {
    if (view.byteLength !== PLAYER_LEAVE_SIZE && view.byteLength !== PLAYER_LEAVE_V1_SIZE && view.byteLength !== LEGACY_PLAYER_LEAVE_SIZE) {
      this.onProtocolError({ code: 4 });
      return;
    }
    const localPlayerId = view.getUint16(1, true);
    if (localPlayerId === this.localPlayerId) return;
    this.onPlayerLeave({
      localPlayerId,
      reason: view.getUint8(3),
      ownerHash: view.byteLength === PLAYER_LEAVE_SIZE || view.byteLength === PLAYER_LEAVE_V1_SIZE ? view.getUint32(4, true) : 0,
      ownerKey: view.byteLength === PLAYER_LEAVE_SIZE ? readU64Key(view, 8) : "",
    });
  }

  decodeChatEvent(view) {
    if (view.byteLength < CHAT_EVENT_HEADER_SIZE) {
      this.onProtocolError({ code: 4 });
      return;
    }
    const localPlayerId = view.getUint16(1, true);
    const length = view.getUint8(5);
    if (length === 0 || length > MAX_CHAT_BYTES || view.byteLength !== CHAT_EVENT_HEADER_SIZE + length) {
      this.onProtocolError({ code: 4 });
      return;
    }
    if (localPlayerId === this.localPlayerId) return;
    const bytes = new Uint8Array(view.buffer, view.byteOffset + CHAT_EVENT_HEADER_SIZE, length);
    this.onChat({
      localPlayerId,
      seq: view.getUint16(3, true),
      message: chatTextDecoder.decode(bytes),
    });
  }

  decodePlayerPose(packet) {
    const chunkX = this.localToGlobalChunkX(packet.localChunkX);
    const chunkZ = this.localToGlobalChunkZ(packet.localChunkZ);
    return {
      localPlayerId: packet.localPlayerId,
      ownerHash: packet.ownerHash || 0,
      ownerKey: packet.ownerKey || "",
      chunkX,
      chunkZ,
      x: chunkX * this.chunkSize + packet.posX / this.positionPrecision,
      y: packet.posY / this.positionPrecision,
      z: chunkZ * this.chunkSize + packet.posZ / this.positionPrecision,
      yaw: decodeYaw(packet.yaw),
      pitch: decodePitch(packet.pitch),
    };
  }

  sendPong() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(new Uint8Array([MSG_PONG]).buffer);
  }

  writeWalletHint(bytes, offset) {
    if (!this.identityHint) return;
    const walletBytes = decodeBase58PublicKey(this.identityHint);
    if (walletBytes) {
      bytes.set(walletBytes, offset);
      return;
    }
    const seed = hashString32(this.identityHint);
    let value = seed || 0x9e3779b9;
    for (let i = 0; i < 32; i++) {
      value ^= value << 13;
      value ^= value >>> 17;
      value ^= value << 5;
      bytes[offset + i] = (value >>> ((i & 3) * 8)) & 0xff;
    }
  }

  worldToChunk(x, z) {
    return {
      x: Math.floor(x / this.chunkSize),
      z: Math.floor(z / this.chunkSize),
    };
  }

  globalToLocalChunk(chunkX, chunkZ) {
    return {
      x: chunkX - (this.centerChunkX - this.serviceRadiusChunks),
      z: chunkZ - (this.centerChunkZ - this.serviceRadiusChunks),
    };
  }

  localToGlobalChunkX(localChunkX) {
    return this.centerChunkX - this.serviceRadiusChunks + localChunkX;
  }

  localToGlobalChunkZ(localChunkZ) {
    return this.centerChunkZ - this.serviceRadiusChunks + localChunkZ;
  }
}

function guardianUrlFromQuery() {
  try {
    const url = new URL(window.location.href);
    const value = url.searchParams.get("guardian") || url.searchParams.get("guardianUrl");
    return value || "";
  } catch {
    return "";
  }
}

function guardianSessionId(session) {
  if (!session?.walletAddress || !session.walletBoundAt) return "";
  return `${session.walletAddress}:${session.walletBoundAt}`;
}

function hashString32(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function decodeBase58PublicKey(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const decoded = [];
  for (const char of text) {
    const digit = base58Lookup.get(char);
    if (digit === undefined) return null;
    let carry = digit;
    for (let i = 0; i < decoded.length; i++) {
      const next = decoded[i] * 58 + carry;
      decoded[i] = next & 0xff;
      carry = next >> 8;
    }
    while (carry > 0) {
      decoded.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const char of text) {
    if (char !== "1") break;
    decoded.push(0);
  }
  if (decoded.length !== 32) return null;
  return Uint8Array.from(decoded.reverse());
}

function readU64Key(view, offset) {
  const low = view.getUint32(offset, true);
  const high = view.getUint32(offset + 4, true);
  return `${high.toString(16).padStart(8, "0")}${low.toString(16).padStart(8, "0")}`;
}

function chatTextBytes(message) {
  const normalized = String(message ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return new Uint8Array();
  const encoded = chatTextEncoder.encode(normalized);
  if (encoded.length <= MAX_CHAT_BYTES) return encoded;
  let end = MAX_CHAT_BYTES;
  while (end > 0 && (encoded[end] & 0xc0) === 0x80) end--;
  return encoded.slice(0, Math.max(0, end));
}

function randomNonceWords() {
  const words = new Uint32Array(2);
  crypto.getRandomValues(words);
  return { low: words[0], high: words[1] };
}

function clampByte(value) {
  return Math.max(0, Math.min(255, value));
}

function clampU16(value) {
  return Math.max(0, Math.min(65535, value));
}

function encodeYaw(radians) {
  const normalized = ((radians % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return Math.round((normalized / (Math.PI * 2)) * 255) & 0xff;
}

function decodeYaw(value) {
  return (value / 256) * Math.PI * 2;
}

function encodePitch(radians) {
  return Math.max(-128, Math.min(127, Math.round((radians / (Math.PI / 2)) * 127)));
}

function decodePitch(value) {
  return (value / 127) * (Math.PI / 2);
}
