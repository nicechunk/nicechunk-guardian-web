import "./style.css";
import "../src/site-header.css";
import { finishSiteLoading, setSiteLoadingProgress } from "../src/site-ui.js";
import "../src/polyfills.js";
import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { initI18n, t } from "../src/i18n.js";
import {
  chunkToGuardianRegion,
  createRegisterGuardianInstruction,
  createUpdateGuardianEndpointInstruction,
  decodeGuardianRegion,
  decodeGuardianRegistry,
  deriveGuardianRegistryPda,
  deriveGuardianRegionPda,
  deriveGuardianTreasuryAuthorityPda,
  GUARDIAN_REGION_LEN,
  GUARDIAN_STATUS_ACTIVE,
  NICECHUNK_GUARDIAN_PROGRAM_ID,
  DEVNET_NCK_MINT,
} from "../sdk/nicechunk-guardian.ts";
import {
  deriveGlobalConfigPda,
  NICECHUNK_CORE_PROGRAM_ID,
} from "../sdk/nicechunk-core.ts";
import {
  createNicechunkRpcFetch,
  getNicechunkRpcUrl,
  rpcConfigChangedEventName,
} from "../src/rpcConfig.js";

let rpcUrl = getNicechunkRpcUrl();
let connection = createConnection(rpcUrl);
const [globalConfig] = deriveGlobalConfigPda(NICECHUNK_CORE_PROGRAM_ID);
const [registry] = deriveGuardianRegistryPda({
  globalConfig,
  programId: NICECHUNK_GUARDIAN_PROGRAM_ID,
});
const [treasuryAuthority] = deriveGuardianTreasuryAuthorityPda({
  globalConfig,
  programId: NICECHUNK_GUARDIAN_PROGRAM_ID,
});
const treasuryNckToken = getAssociatedTokenAddressSync(DEVNET_NCK_MINT, treasuryAuthority, true);

let walletPublicKey = null;
let guardiansCache = [];
let currentView = "list";
const GUARDIAN_REGION_CHUNKS = 100;
const MAP_DEFAULT_PIXELS_PER_CHUNK = 1.6;
const MAP_MIN_PIXELS_PER_CHUNK = 0.0005;
const MAP_MAX_PIXELS_PER_CHUNK = 256;
const MAP_RULER_TOP = 34;
const MAP_RULER_LEFT = 58;
const mapState = {
  canvas: null,
  scale: MAP_DEFAULT_PIXELS_PER_CHUNK,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  dragOffsetX: 0,
  dragOffsetY: 0,
  handlersReady: false,
};

const els = {
  connectWallet: document.querySelector("#connectWallet"),
  openRegister: document.querySelector("#openRegister"),
  closeRegister: document.querySelector("#closeRegister"),
  registerPanel: document.querySelector("#registerNode"),
  walletStatus: document.querySelector("#walletStatus"),
  form: document.querySelector("#guardianForm"),
  chunkX: document.querySelector("#chunkX"),
  chunkY: document.querySelector("#chunkY"),
  connection: document.querySelector("#connection"),
  regionPreview: document.querySelector("#regionPreview"),
  formStatus: document.querySelector("#formStatus"),
  registryStatus: document.querySelector("#registryStatus"),
  guardianList: document.querySelector("#guardianList"),
  guardianMap: document.querySelector("#guardianMap"),
  guardianMapCanvas: document.querySelector("#guardianMapCanvas"),
  listView: document.querySelector("#listView"),
  mapView: document.querySelector("#mapView"),
  refreshGuardians: document.querySelector("#refreshGuardians"),
  programExplorerLink: document.querySelector("#programExplorerLink"),
  programExplorerIcon: document.querySelector("#programExplorerIcon"),
};

window.addEventListener(rpcConfigChangedEventName, () => {
  rpcUrl = getNicechunkRpcUrl();
  connection = createConnection(rpcUrl);
  void refreshGuardians();
});

setSiteLoadingProgress(30);
await initI18n();
setSiteLoadingProgress(52);
setupExplorerLinks();
setupHandlers();
updateRegionPreview();
setSiteLoadingProgress(72);
await refreshGuardians();
finishSiteLoading();

function createConnection(url) {
  return new Connection(url, {
    commitment: "confirmed",
    fetch: createNicechunkRpcFetch("guardian-page"),
  });
}

function setupExplorerLinks() {
  const url = explorerAddressUrl(NICECHUNK_GUARDIAN_PROGRAM_ID);
  if (els.programExplorerLink) {
    els.programExplorerLink.href = url;
    els.programExplorerLink.textContent = NICECHUNK_GUARDIAN_PROGRAM_ID.toBase58();
  }
  if (els.programExplorerIcon) els.programExplorerIcon.href = url;
}

function setupHandlers() {
  els.connectWallet.addEventListener("click", connectWallet);
  els.openRegister.addEventListener("click", openRegisterPanel);
  els.closeRegister.addEventListener("click", closeRegisterPanel);
  els.listView.addEventListener("click", () => setGuardianView("list"));
  els.mapView.addEventListener("click", () => setGuardianView("map"));
  els.refreshGuardians.addEventListener("click", refreshGuardians);
  els.form.addEventListener("submit", registerGuardian);
  window.addEventListener("nicechunk:languagechange", refreshGuardians);
  window.addEventListener("resize", drawGuardianMap);
  for (const input of [els.chunkX, els.chunkY]) {
    input.addEventListener("input", updateRegionPreview);
  }
  setupGuardianCanvasHandlers();
}

async function connectWallet() {
  try {
    const provider = window.solana;
    if (!provider?.isPhantom && !provider?.isSolflare) {
      setFormStatus(t("guardian.status.noWallet"), true);
      els.registryStatus.textContent = t("guardian.status.noWallet");
      els.registryStatus.classList.add("error");
      return false;
    }
    const result = await provider.connect();
    walletPublicKey = new PublicKey(result.publicKey.toBase58());
    els.walletStatus.textContent = shortAddress(walletPublicKey);
    setFormStatus(t("guardian.status.walletConnected"), false);
    await refreshGuardians();
    return true;
  } catch (error) {
    setFormStatus(error?.message || t("guardian.status.connectFailed"), true);
    return false;
  }
}

async function openRegisterPanel() {
  if (!walletPublicKey) {
    const connected = await connectWallet();
    if (!connected) return;
  }
  els.registerPanel.hidden = false;
  setFormStatus(t("guardian.status.ready"), false);
  els.connection.focus();
}

function closeRegisterPanel() {
  els.registerPanel.hidden = true;
}

async function registerGuardian(event) {
  event.preventDefault();
  try {
    if (!walletPublicKey) {
      await connectWallet();
      if (!walletPublicKey) return;
    }

    const chunkX = readInteger(els.chunkX.value, "chunkX");
    const chunkY = readInteger(els.chunkY.value, "chunkY");
    const regionX = chunkToGuardianRegion(chunkX);
    const regionY = chunkToGuardianRegion(chunkY);
    const endpoint = parseGuardianConnection(els.connection.value);
    const ownerNckToken = getAssociatedTokenAddressSync(DEVNET_NCK_MINT, walletPublicKey);
    await validateRegistrationFunds(walletPublicKey, ownerNckToken);
    setFormStatus(t("guardian.status.confirmWallet"), false);

    const ix = createRegisterGuardianInstruction({
      payer: walletPublicKey,
      owner: walletPublicKey,
      ownerNckToken,
      treasuryNckToken,
      regionX,
      regionY,
      host: endpoint.host,
      port: endpoint.port,
      useTls: endpoint.useTls,
      operator: walletPublicKey,
      isGenesis: false,
      guardianProgramId: NICECHUNK_GUARDIAN_PROGRAM_ID,
      coreProgramId: NICECHUNK_CORE_PROGRAM_ID,
      nckMint: DEVNET_NCK_MINT,
    });
    const signature = await sendWalletInstruction(ix);
    setFormStatus(t("guardian.status.registered", { signature: shortSignature(signature) }), false);
    await refreshGuardians();
    closeRegisterPanel();
  } catch (error) {
    setFormStatus(formatGuardianError(error), true);
  }
}

async function validateRegistrationFunds(owner, ownerNckToken) {
  const solBalance = await connection.getBalance(owner, "confirmed");
  if (solBalance < 5_000_000) {
    throw new Error(t("guardian.error.insufficientSol"));
  }

  const tokenAccount = await connection.getTokenAccountBalance(ownerNckToken, "confirmed").catch(() => null);
  const rawAmount = BigInt(tokenAccount?.value?.amount || "0");
  if (rawAmount < 100_000_000_000n) {
    throw new Error(t("guardian.error.insufficientNck"));
  }
}

async function refreshGuardians() {
  els.registryStatus.textContent = t("guardian.list.loading");
  els.registryStatus.classList.remove("error");
  clearGuardianViews();
  try {
    const registryAccount = await connection.getAccountInfo(registry, "confirmed");
    if (!registryAccount) {
      els.registryStatus.textContent = t("guardian.list.registryMissing");
      return;
    }
    const decodedRegistry = decodeGuardianRegistry(registryAccount.data);
    const accounts = await connection.getProgramAccounts(NICECHUNK_GUARDIAN_PROGRAM_ID, {
      commitment: "confirmed",
      filters: [{ dataSize: GUARDIAN_REGION_LEN }],
    });
    guardiansCache = accounts
      .map(({ pubkey, account }) => {
        try {
          return decodeGuardianRegion(account.data, pubkey);
        } catch (_error) {
          return null;
        }
      })
      .filter((guardian) => guardian && guardian.status === GUARDIAN_STATUS_ACTIVE)
      .sort((a, b) => Number(isOwnGuardian(b)) - Number(isOwnGuardian(a)) || a.regionX - b.regionX || a.regionY - b.regionY);

    els.registryStatus.textContent = t("guardian.list.registrySummary", {
      active: String(guardiansCache.length),
      total: decodedRegistry.totalRegistrations.toString(),
    });
    if (!guardiansCache.length) {
      renderEmptyGuardianState();
      return;
    }
    renderGuardianViews();
  } catch (error) {
    clearGuardianViews();
    els.registryStatus.classList.add("error");
    els.registryStatus.textContent = error?.message || t("guardian.list.loadFailed");
  }
}

function clearGuardianViews() {
  els.guardianList.replaceChildren();
  drawGuardianMap();
}

function setGuardianView(view) {
  currentView = view;
  els.listView.classList.toggle("active", view === "list");
  els.mapView.classList.toggle("active", view === "map");
  renderGuardianViews();
}

function renderGuardianViews() {
  els.guardianList.hidden = currentView !== "list";
  els.guardianMap.hidden = currentView !== "map";
  els.guardianList.replaceChildren();

  if (!guardiansCache.length) {
    renderEmptyGuardianState();
    return;
  }

  if (currentView === "list") {
    for (const guardian of guardiansCache) {
      els.guardianList.append(renderGuardianCard(guardian));
    }
    return;
  }

  resetGuardianMapView(guardiansCache);
  drawGuardianMap();
}

function renderEmptyGuardianState() {
  const empty = document.createElement("p");
  empty.className = "status-line";
  empty.textContent = t("guardian.list.empty");
  if (currentView === "map") {
    els.guardianMap.hidden = false;
    els.guardianList.hidden = true;
    ensureGuardianCanvas();
    resetGuardianMapView([]);
    drawGuardianMap();
  } else {
    els.guardianList.hidden = false;
    els.guardianMap.hidden = true;
    els.guardianList.append(empty);
  }
}

function renderGuardianCard(guardian) {
  const card = document.createElement("section");
  card.className = "guardian-card";
  const isMine = isOwnGuardian(guardian);
  if (isMine) card.classList.add("is-mine");
  const endpoint = formatGuardianEndpoint(guardian);
  card.innerHTML = `
    <div>
      <div class="guardian-card-head">
        <h3></h3>
        <span class="mine-badge" hidden></span>
      </div>
      <dl>
        <div><dt></dt><dd></dd></div>
        <div><dt></dt><dd></dd></div>
        <div><dt></dt><dd></dd></div>
        <div class="chain-address-field"><dt></dt><dd></dd></div>
      </dl>
    </div>
    <div class="card-actions">
      <button class="secondary-action edit-action" type="button" hidden></button>
    </div>
    <form class="endpoint-edit" hidden>
      <label>
        <span></span>
        <input class="edit-connection" type="text" inputmode="url" autocomplete="off" />
      </label>
      <div class="edit-actions">
        <button class="primary-action save-action" type="submit"></button>
        <button class="secondary-action cancel-action" type="button"></button>
      </div>
    </form>
  `;
  card.querySelector("h3").textContent = t("guardian.card.title", {
    x: guardian.regionX,
    y: guardian.regionY,
  });
  const mineBadge = card.querySelector(".mine-badge");
  mineBadge.dataset.i18n = "guardian.card.mine";
  mineBadge.textContent = t("guardian.card.mine");
  mineBadge.hidden = !isMine;
  const rows = [...card.querySelectorAll("dl > div")];
  setRow(rows[0], t("guardian.card.chunkRange"), `${guardian.minChunkX}..${guardian.maxChunkX}, ${guardian.minChunkY}..${guardian.maxChunkY}`);
  setRow(rows[1], t("guardian.card.wallet"), shortAddress(guardian.owner));
  setRow(rows[2], t("guardian.card.endpoint"), endpoint);
  rows[2].querySelector("dd").classList.add("endpoint");
  setChainAddressRow(rows[3], guardian.publicKey);
  const proofRow = document.createElement("div");
  proofRow.innerHTML = "<dt></dt><dd></dd>";
  rows[2].after(proofRow);
  setRow(proofRow, t("guardian.card.proof"), formatTimestamp(guardian.lastProofAt));
  const editButton = card.querySelector(".edit-action");
  editButton.textContent = t("guardian.card.edit");
  editButton.hidden = !isMine;
  if (isMine) setupEndpointEditor(card, guardian);
  return card;
}

function resetGuardianMapView(guardians) {
  ensureGuardianCanvas();
  const rect = els.guardianMapCanvas.getBoundingClientRect();
  const viewportWidth = Math.max(1, rect.width - MAP_RULER_LEFT);
  const viewportHeight = Math.max(1, rect.height - MAP_RULER_TOP);
  const ownGuardians = guardians.filter(isOwnGuardian);
  const focusGuardians = ownGuardians.length ? ownGuardians : guardians;
  const minChunkX = focusGuardians.length ? Math.min(...focusGuardians.map((guardian) => guardian.minChunkX)) : -50;
  const maxChunkX = focusGuardians.length ? Math.max(...focusGuardians.map((guardian) => guardian.maxChunkX + 1)) : 50;
  const minChunkY = focusGuardians.length ? Math.min(...focusGuardians.map((guardian) => guardian.minChunkY)) : -50;
  const maxChunkY = focusGuardians.length ? Math.max(...focusGuardians.map((guardian) => guardian.maxChunkY + 1)) : 50;
  const contentWidth = Math.max(100, maxChunkX - minChunkX);
  const contentHeight = Math.max(100, maxChunkY - minChunkY);
  const centerX = minChunkX + contentWidth / 2;
  const centerY = minChunkY + contentHeight / 2;
  const fitScale = Math.min((viewportWidth - 40) / contentWidth, (viewportHeight - 40) / contentHeight);
  mapState.scale = clamp(fitScale, 0.35, MAP_DEFAULT_PIXELS_PER_CHUNK);
  mapState.offsetX = MAP_RULER_LEFT + viewportWidth / 2 - centerX * mapState.scale;
  mapState.offsetY = MAP_RULER_TOP + viewportHeight / 2 + centerY * mapState.scale;
}

function ensureGuardianCanvas() {
  if (!els.guardianMapCanvas) {
    els.guardianMapCanvas = document.createElement("canvas");
    els.guardianMapCanvas.id = "guardianMapCanvas";
    els.guardianMapCanvas.className = "guardian-map-canvas";
  }
  if (!els.guardianMap.contains(els.guardianMapCanvas)) {
    els.guardianMap.replaceChildren(els.guardianMapCanvas);
  }
  mapState.canvas = els.guardianMapCanvas;
  setupGuardianCanvasHandlers();
}

function setupGuardianCanvasHandlers() {
  const canvas = els.guardianMapCanvas;
  if (!canvas || mapState.handlersReady) return;
  mapState.handlersReady = true;
  mapState.canvas = canvas;

  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const worldX = screenToWorldX(mouseX);
    const worldY = screenToWorldY(mouseY);
    const nextScale = clamp(mapState.scale * Math.exp(-event.deltaY * 0.0015), MAP_MIN_PIXELS_PER_CHUNK, MAP_MAX_PIXELS_PER_CHUNK);
    mapState.scale = nextScale;
    mapState.offsetX = mouseX - worldX * nextScale;
    mapState.offsetY = mouseY + worldY * nextScale;
    drawGuardianMap();
  }, { passive: false });

  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    mapState.isDragging = true;
    mapState.dragStartX = event.clientX;
    mapState.dragStartY = event.clientY;
    mapState.dragOffsetX = mapState.offsetX;
    mapState.dragOffsetY = mapState.offsetY;
    canvas.classList.add("is-dragging");
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!mapState.isDragging) return;
    mapState.offsetX = mapState.dragOffsetX + event.clientX - mapState.dragStartX;
    mapState.offsetY = mapState.dragOffsetY + event.clientY - mapState.dragStartY;
    drawGuardianMap();
  });

  const stopDragging = (event) => {
    if (!mapState.isDragging) return;
    mapState.isDragging = false;
    canvas.classList.remove("is-dragging");
    if (event.pointerId !== undefined && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };
  canvas.addEventListener("pointerup", stopDragging);
  canvas.addEventListener("pointercancel", stopDragging);
  canvas.addEventListener("pointerleave", stopDragging);
}

function drawGuardianMap() {
  const canvas = els.guardianMapCanvas;
  if (!canvas || els.guardianMap.hidden) return;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.fillStyle = "#081017";
  ctx.fillRect(0, 0, rect.width, rect.height);
  drawCanvasBackground(ctx, rect.width, rect.height);
  drawWorldGrid(ctx, rect.width, rect.height);

  const byRegion = new Map(guardiansCache.map((guardian) => [`${guardian.regionX}:${guardian.regionY}`, guardian]));
  const visible = getVisibleWorldBounds(rect.width, rect.height);
  const minRegionX = Math.floor(visible.minX / GUARDIAN_REGION_CHUNKS) - 1;
  const maxRegionX = Math.floor(visible.maxX / GUARDIAN_REGION_CHUNKS) + 1;
  const minRegionY = Math.floor(visible.minY / GUARDIAN_REGION_CHUNKS) - 1;
  const maxRegionY = Math.floor(visible.maxY / GUARDIAN_REGION_CHUNKS) + 1;
  const regionCount = (maxRegionX - minRegionX + 1) * (maxRegionY - minRegionY + 1);
  if (regionCount <= 2500) {
    for (let y = minRegionY; y <= maxRegionY; y += 1) {
      for (let x = minRegionX; x <= maxRegionX; x += 1) {
        drawGuardianRegion(ctx, x, y, byRegion.get(`${x}:${y}`));
      }
    }
  } else {
    drawVisibleActiveGuardianRegions(ctx, visible);
  }
  drawCoordinateRulers(ctx, rect.width, rect.height);
}

function drawCanvasBackground(ctx, width, height) {
  ctx.save();
  ctx.strokeStyle = "rgba(142, 238, 255, 0.055)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWorldGrid(ctx, width, height) {
  const visible = getVisibleWorldBounds(width, height);
  const tickStep = chooseTickStep(mapState.scale, 86);
  const minorStep = Math.max(1, tickStep / 5);
  drawGridLines(ctx, visible, minorStep, "rgba(142, 238, 255, 0.045)", width, height);
  drawGridLines(ctx, visible, tickStep, "rgba(142, 238, 255, 0.105)", width, height);
  if (GUARDIAN_REGION_CHUNKS * mapState.scale >= 8) {
    drawGridLines(ctx, visible, GUARDIAN_REGION_CHUNKS, "rgba(168, 255, 47, 0.13)", width, height);
  }
  drawOriginAxes(ctx, visible, width, height);
}

function drawGridLines(ctx, visible, step, color, width, height) {
  if (!Number.isFinite(step) || step <= 0) return;
  const firstX = Math.floor(visible.minX / step) * step;
  const firstY = Math.floor(visible.minY / step) * step;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let x = firstX; x <= visible.maxX; x += step) {
    const screenX = worldToScreenX(x);
    if (screenX < MAP_RULER_LEFT || screenX > width) continue;
    ctx.beginPath();
    ctx.moveTo(screenX, MAP_RULER_TOP);
    ctx.lineTo(screenX, height);
    ctx.stroke();
  }
  for (let y = firstY; y <= visible.maxY; y += step) {
    const screenY = worldToScreenY(y);
    if (screenY < MAP_RULER_TOP || screenY > height) continue;
    ctx.beginPath();
    ctx.moveTo(MAP_RULER_LEFT, screenY);
    ctx.lineTo(width, screenY);
    ctx.stroke();
  }
  ctx.restore();
}

function drawOriginAxes(ctx, visible, width, height) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 191, 66, 0.42)";
  ctx.lineWidth = 1.4;
  if (visible.minX <= 0 && visible.maxX >= 0) {
    const x = worldToScreenX(0);
    ctx.beginPath();
    ctx.moveTo(x, MAP_RULER_TOP);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  if (visible.minY <= 0 && visible.maxY >= 0) {
    const y = worldToScreenY(0);
    ctx.beginPath();
    ctx.moveTo(MAP_RULER_LEFT, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawVisibleActiveGuardianRegions(ctx, visible) {
  for (const guardian of guardiansCache) {
    const minX = guardian.regionX * GUARDIAN_REGION_CHUNKS;
    const maxX = minX + GUARDIAN_REGION_CHUNKS;
    const minY = guardian.regionY * GUARDIAN_REGION_CHUNKS;
    const maxY = minY + GUARDIAN_REGION_CHUNKS;
    if (maxX < visible.minX || minX > visible.maxX || maxY < visible.minY || minY > visible.maxY) continue;
    drawGuardianRegion(ctx, guardian.regionX, guardian.regionY, guardian);
  }
}

function drawGuardianRegion(ctx, regionX, regionY, guardian) {
  const active = Boolean(guardian);
  const own = active && isOwnGuardian(guardian);
  const minChunkX = active ? guardian.minChunkX : regionX * GUARDIAN_REGION_CHUNKS;
  const maxChunkX = active ? guardian.maxChunkX : regionX * GUARDIAN_REGION_CHUNKS + GUARDIAN_REGION_CHUNKS - 1;
  const minChunkY = active ? guardian.minChunkY : regionY * GUARDIAN_REGION_CHUNKS;
  const maxChunkY = active ? guardian.maxChunkY : regionY * GUARDIAN_REGION_CHUNKS + GUARDIAN_REGION_CHUNKS - 1;
  const x = worldToScreenX(minChunkX);
  const y = worldToScreenY(maxChunkY + 1);
  const size = GUARDIAN_REGION_CHUNKS * mapState.scale;

  ctx.save();
  ctx.shadowBlur = active ? (own ? 24 : 20) : 0;
  ctx.shadowColor = own ? "rgba(168, 255, 47, 0.7)" : "rgba(0, 199, 255, 0.72)";
  ctx.fillStyle = active ? (own ? "rgba(168, 255, 47, 0.12)" : "rgba(0, 199, 255, 0.12)") : "rgba(116, 130, 140, 0.08)";
  ctx.strokeStyle = active ? (own ? "rgba(168, 255, 47, 0.9)" : "rgba(0, 199, 255, 0.82)") : "rgba(116, 130, 140, 0.42)";
  ctx.lineWidth = active ? 2.5 : 1.4;
  ctx.fillRect(x, y, size, size);
  ctx.strokeRect(x, y, size, size);
  ctx.shadowBlur = 0;

  if (size / 10 >= 3) {
    ctx.strokeStyle = active ? "rgba(142, 238, 255, 0.26)" : "rgba(160, 170, 178, 0.14)";
    ctx.lineWidth = 0.8;
    for (let index = 1; index < 10; index += 1) {
      const offset = x + (size / 10) * index;
      ctx.beginPath();
      ctx.moveTo(offset, y);
      ctx.lineTo(offset, y + size);
      ctx.stroke();
    }
    for (let index = 1; index < 10; index += 1) {
      const offset = y + (size / 10) * index;
      ctx.beginPath();
      ctx.moveTo(x, offset);
      ctx.lineTo(x + size, offset);
      ctx.stroke();
    }
  }

  if (own && size >= 28) {
    ctx.fillStyle = "rgba(168, 255, 47, 0.95)";
    ctx.beginPath();
    ctx.moveTo(x + size - 18, y + 10);
    ctx.lineTo(x + size - 8, y + 28);
    ctx.lineTo(x + size - 28, y + 28);
    ctx.closePath();
    ctx.fill();
  }

  if (size >= 58) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = active ? "#edf6ff" : "rgba(169, 187, 198, 0.5)";
    ctx.font = `${size >= 130 ? 700 : 600} ${size >= 130 ? 12 : 10}px SFMono-Regular, Consolas, Liberation Mono, monospace`;
    ctx.fillText(`${minChunkX}..${maxChunkX}`, x + size / 2, y + size / 2 - 9);
    ctx.fillText(`${minChunkY}..${maxChunkY}`, x + size / 2, y + size / 2 + 10);
  }
  ctx.restore();
}

function drawCoordinateRulers(ctx, width, height) {
  const visible = getVisibleWorldBounds(width, height);
  const tickStep = chooseTickStep(mapState.scale, 88);
  const firstX = Math.floor(visible.minX / tickStep) * tickStep;
  const firstY = Math.floor(visible.minY / tickStep) * tickStep;

  ctx.save();
  ctx.fillStyle = "rgba(5, 9, 13, 0.86)";
  ctx.fillRect(0, 0, width, MAP_RULER_TOP);
  ctx.fillRect(0, 0, MAP_RULER_LEFT, height);
  ctx.fillStyle = "rgba(0, 199, 255, 0.08)";
  ctx.fillRect(0, 0, MAP_RULER_LEFT, MAP_RULER_TOP);
  ctx.strokeStyle = "rgba(142, 238, 255, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MAP_RULER_LEFT, 0);
  ctx.lineTo(MAP_RULER_LEFT, height);
  ctx.moveTo(0, MAP_RULER_TOP);
  ctx.lineTo(width, MAP_RULER_TOP);
  ctx.stroke();

  ctx.font = "700 10px SFMono-Regular, Consolas, Liberation Mono, monospace";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(237, 246, 255, 0.84)";
  ctx.strokeStyle = "rgba(142, 238, 255, 0.4)";

  for (let x = firstX; x <= visible.maxX; x += tickStep) {
    const screenX = worldToScreenX(x);
    if (screenX < MAP_RULER_LEFT || screenX > width) continue;
    ctx.beginPath();
    ctx.moveTo(screenX, MAP_RULER_TOP - 8);
    ctx.lineTo(screenX, MAP_RULER_TOP);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillText(formatCoordinate(x), screenX, 14);
  }

  for (let y = firstY; y <= visible.maxY; y += tickStep) {
    const screenY = worldToScreenY(y);
    if (screenY < MAP_RULER_TOP || screenY > height) continue;
    ctx.beginPath();
    ctx.moveTo(MAP_RULER_LEFT - 8, screenY);
    ctx.lineTo(MAP_RULER_LEFT, screenY);
    ctx.stroke();
    ctx.textAlign = "right";
    ctx.fillText(formatCoordinate(y), MAP_RULER_LEFT - 12, screenY);
  }

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(168, 255, 47, 0.9)";
  ctx.fillText(t("guardian.map.axisX"), MAP_RULER_LEFT + 8, MAP_RULER_TOP - 14);
  ctx.save();
  ctx.translate(15, MAP_RULER_TOP + 10);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "right";
  ctx.fillText(t("guardian.map.axisY"), 0, 0);
  ctx.restore();

  const centerX = screenToWorldX(MAP_RULER_LEFT + (width - MAP_RULER_LEFT) / 2);
  const centerY = screenToWorldY(MAP_RULER_TOP + (height - MAP_RULER_TOP) / 2);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(169, 187, 198, 0.86)";
  ctx.fillText(t("guardian.map.center", { x: formatCoordinate(centerX), y: formatCoordinate(centerY) }), width - 12, height - 14);
  ctx.restore();
}

function getVisibleWorldBounds(width, height) {
  const minX = screenToWorldX(MAP_RULER_LEFT);
  const maxX = screenToWorldX(width);
  const maxY = screenToWorldY(MAP_RULER_TOP);
  const minY = screenToWorldY(height);
  return {
    minX: Math.min(minX, maxX),
    maxX: Math.max(minX, maxX),
    minY: Math.min(minY, maxY),
    maxY: Math.max(minY, maxY),
  };
}

function worldToScreenX(value) {
  return mapState.offsetX + value * mapState.scale;
}

function worldToScreenY(value) {
  return mapState.offsetY - value * mapState.scale;
}

function screenToWorldX(value) {
  return (value - mapState.offsetX) / mapState.scale;
}

function screenToWorldY(value) {
  return (mapState.offsetY - value) / mapState.scale;
}

function chooseTickStep(pxPerChunk, targetPixels) {
  const raw = targetPixels / Math.max(pxPerChunk, MAP_MIN_PIXELS_PER_CHUNK);
  const exponent = Math.floor(Math.log10(raw));
  const base = 10 ** exponent;
  const normalized = raw / base;
  let step = 10 * base;
  if (normalized <= 1) step = base;
  else if (normalized <= 2) step = 2 * base;
  else if (normalized <= 5) step = 5 * base;
  return Math.max(1, step);
}

function formatCoordinate(value) {
  const rounded = Math.abs(value) >= 1000 ? Math.round(value) : Math.round(value * 10) / 10;
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

function setupEndpointEditor(card, guardian) {
  const editButton = card.querySelector(".edit-action");
  const form = card.querySelector(".endpoint-edit");
  const connectionInput = card.querySelector(".edit-connection");
  const labels = card.querySelectorAll(".endpoint-edit label span");
  labels[0].textContent = t("guardian.form.connection");
  connectionInput.placeholder = t("guardian.form.connectionPlaceholder");
  connectionInput.setAttribute("aria-label", t("guardian.form.connection"));
  card.querySelector(".save-action").textContent = t("guardian.card.save");
  card.querySelector(".cancel-action").textContent = t("guardian.card.cancel");

  editButton.addEventListener("click", () => {
    connectionInput.value = formatGuardianEndpoint(guardian);
    form.hidden = false;
    editButton.hidden = true;
    connectionInput.focus();
  });
  card.querySelector(".cancel-action").addEventListener("click", () => {
    form.hidden = true;
    editButton.hidden = false;
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await updateGuardianEndpoint(guardian, parseGuardianConnection(connectionInput.value));
  });
}

async function updateGuardianEndpoint(guardian, endpoint) {
  try {
    setFormStatus(t("guardian.status.updateConfirm"), false);
    const ix = createUpdateGuardianEndpointInstruction({
      owner: walletPublicKey,
      regionX: guardian.regionX,
      regionY: guardian.regionY,
      host: endpoint.host,
      port: endpoint.port,
      useTls: endpoint.useTls,
      guardianProgramId: NICECHUNK_GUARDIAN_PROGRAM_ID,
      coreProgramId: NICECHUNK_CORE_PROGRAM_ID,
    });
    const signature = await sendWalletInstruction(ix);
    setFormStatus(t("guardian.status.updated", { signature: shortSignature(signature) }), false);
    await refreshGuardians();
  } catch (error) {
    setFormStatus(formatGuardianError(error, "guardian.status.updateFailed"), true);
  }
}

function setRow(row, label, value) {
  row.querySelector("dt").textContent = label;
  row.querySelector("dd").textContent = value;
}

function setChainAddressRow(row, publicKey) {
  row.querySelector("dt").textContent = t("guardian.card.chainAddress");
  setChainAddressNode(row.querySelector("dd"), publicKey);
}

function setChainAddressNode(container, publicKey) {
  const address = publicKey.toBase58();
  const url = explorerAddressUrl(publicKey);
  container.innerHTML = `
    <div class="chain-address-row card-chain-address-row">
      <a class="chain-address-link" target="_blank" rel="noopener noreferrer"></a>
      <a class="inspect-link" target="_blank" rel="noopener noreferrer"><span aria-hidden="true"></span></a>
    </div>
  `;
  const [addressLink, inspectLink] = container.querySelectorAll("a");
  addressLink.href = url;
  addressLink.textContent = address;
  addressLink.setAttribute("aria-label", t("guardian.card.viewOnChain"));
  inspectLink.href = url;
  inspectLink.setAttribute("aria-label", t("guardian.card.viewOnChain"));
}

async function sendWalletInstruction(ix) {
  const provider = window.solana;
  const tx = new Transaction().add(ix);
  tx.feePayer = walletPublicKey;
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  const signed = await provider.signTransaction(tx);
  const signature = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
  });
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  return signature;
}

function isOwnGuardian(guardian) {
  return Boolean(walletPublicKey && guardian.owner.equals(walletPublicKey));
}

function updateRegionPreview() {
  const chunkX = Number(els.chunkX.value || 0);
  const chunkY = Number(els.chunkY.value || 0);
  const regionX = chunkToGuardianRegion(chunkX);
  const regionY = chunkToGuardianRegion(chunkY);
  const [region] = deriveGuardianRegionPda({
    globalConfig,
    regionX,
    regionY,
    programId: NICECHUNK_GUARDIAN_PROGRAM_ID,
  });
  els.regionPreview.textContent = `${regionX}, ${regionY} · ${shortAddress(region)}`;
}

function setFormStatus(message, isError) {
  els.formStatus.textContent = message;
  els.formStatus.classList.toggle("error", Boolean(isError));
}

function readInteger(value, field) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(t("guardian.status.invalidInteger", { field }));
  return parsed;
}

function parseGuardianConnection(value) {
  const raw = String(value || "").trim();
  if (!raw) throw new Error(t("guardian.error.invalidConnection"));
  const normalized = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `wss://${raw}`;
  let url;
  try {
    url = new URL(normalized);
  } catch (_error) {
    throw new Error(t("guardian.error.invalidConnection"));
  }
  if (!["ws:", "wss:"].includes(url.protocol) || !url.hostname || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error(t("guardian.error.invalidConnection"));
  }
  const useTls = url.protocol === "wss:";
  const port = Number(url.port || (useTls ? 443 : 80));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(t("guardian.error.invalidPort"));
  }
  return { host: url.hostname, port, useTls };
}

function formatGuardianEndpoint(guardian) {
  return `${guardian.useTls ? "wss" : "ws"}://${guardian.host}:${guardian.port}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function shortAddress(value) {
  const text = value?.toBase58 ? value.toBase58() : String(value);
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

function shortSignature(value) {
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

function explorerAddressUrl(value) {
  const address = value?.toBase58 ? value.toBase58() : String(value);
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

function formatTimestamp(value) {
  const seconds = Number(value);
  if (!seconds) return t("guardian.card.never");
  return new Date(seconds * 1000).toLocaleString();
}

function formatGuardianError(error, fallbackKey = "guardian.status.registerFailed") {
  const message = error?.message || String(error || "");
  if (message.includes("Attempt to debit an account but found no record of a prior credit")) {
    return t("guardian.error.noPriorCredit");
  }
  const match = message.match(/custom program error: 0x([0-9a-f]+)/i);
  if (!match) return message || t(fallbackKey);

  const code = Number.parseInt(match[1], 16);
  const errorKeys = {
    6413: "guardian.error.invalidTokenAccount",
    6416: "guardian.error.regionAlreadyActive",
    6420: "guardian.error.invalidHost",
    6421: "guardian.error.invalidPort",
    6422: "guardian.error.missingAdjacentGuardian",
    6423: "guardian.error.invalidAdjacentGuardian",
    6424: "guardian.error.noGenesisPermission",
    6425: "guardian.error.genesisAlreadyRegistered",
    6426: "guardian.error.guardianNotActive",
  };
  const key = errorKeys[code];
  if (!key) return t("guardian.error.unknownProgramError", { code: `0x${match[1]}` });
  return t(key);
}
