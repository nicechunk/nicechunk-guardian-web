const loadingState = {
  active: false,
  value: 0,
  timer: 0,
};

export function startSiteLoading(value = 12) {
  ensureProgressBar();
  loadingState.active = true;
  loadingState.value = Math.max(loadingState.value, value);
  document.documentElement.classList.add("site-loading");
  updateProgressBar();
  if (!loadingState.timer) {
    loadingState.timer = window.setInterval(() => {
      if (!loadingState.active) return;
      const ceiling = loadingState.value < 68 ? 68 : 86;
      loadingState.value += Math.max(0.35, (ceiling - loadingState.value) * 0.045);
      updateProgressBar();
    }, 120);
  }
}

export function setSiteLoadingProgress(value) {
  ensureProgressBar();
  loadingState.value = Math.max(loadingState.value, Math.min(96, Number(value) || 0));
  updateProgressBar();
}

export function finishSiteLoading() {
  ensureProgressBar();
  loadingState.value = 100;
  updateProgressBar();
  window.setTimeout(() => {
    loadingState.active = false;
    loadingState.value = 0;
    document.documentElement.classList.remove("site-loading", "site-route-loading");
    updateProgressBar();
    if (loadingState.timer) {
      window.clearInterval(loadingState.timer);
      loadingState.timer = 0;
    }
  }, 280);
}

function installSiteUi() {
  if (window.__nicechunkSiteUiInstalled) return;
  window.__nicechunkSiteUiInstalled = true;
  document.documentElement.classList.add("site-ui-ready");
  ensureUnifiedNavigation();
  ensureUnifiedFooter();
  installMobileMenu();
  installHeaderMetrics();
  startSiteLoading(16);
  installRouteLoading();
  window.addEventListener("load", () => {
    updateHeaderMetrics();
    window.setTimeout(() => {
      if (loadingState.active) finishSiteLoading();
    }, 900);
  });
}

const unifiedNavItems = [
  { key: "home", href: "/" },
  { key: "roadbook", href: "/roadmap/" },
  { key: "worldRules", href: "/world_rule/" },
  { key: "resources", href: "/resource_rule/" },
  { key: "ncm", href: "/ncm/" },
  { key: "ncfm", href: "/ncfm/" },
  { key: "elements", href: "/elements/" },
  { key: "fairness", href: "/fairness/" },
  { key: "proofOfFrontier", href: "/proof-of-frontier/" },
  { key: "seed", href: "/seed/" },
  { key: "guardians", href: "/guardian/" },
  { key: "contracts", href: "/contracts/" },
  { key: "civilization", href: "/civilization/" },
  { key: "trust", href: "/trust/" },
  { key: "docs", href: "/docs/" },
];

const navActiveAliases = {
  "/ncm_dna/": "/ncm/",
};

const footerPrimaryLinks = [
  { key: "home", href: "/" },
  { key: "play", href: "/play/" },
  { key: "roadmap", href: "/roadmap/" },
  { key: "docs", href: "/docs/" },
  { key: "guardian", href: "/guardian/" },
  { key: "contracts", href: "/contracts/" },
];

const footerSocialLinks = [
  { key: "x", href: "https://x.com/nicechunk/" },
  { key: "github", href: "https://github.com/nicechunk" },
];

const footerI18nAttributes = [
  "data-i18n",
  "data-home-i18n",
  "data-docs-i18n",
  "data-roadmap-i18n",
  "data-fairness-i18n",
  "data-trust-i18n",
  "data-wr-i18n",
];

const footerAriaI18nAttributes = [
  "data-i18n-aria-label",
  "data-home-i18n-aria-label",
  "data-docs-i18n-aria-label",
  "data-roadmap-i18n-aria-label",
  "data-fairness-i18n-aria-label",
  "data-trust-i18n-aria-label",
  "data-wr-i18n-aria-label",
];

const unifiedNavLabels = {
  en: {
    home: "Home",
    roadbook: "Roadbook",
    worldRules: "World Rules",
    resources: "Resources",
    ncm: "NCM",
    ncfm: "NCFM",
    elements: "Elements",
    fairness: "Fairness",
    proofOfFrontier: "Proof",
    seed: "Seed",
    guardians: "Guardians",
    contracts: "Contracts",
    civilization: "Civilization",
    trust: "Trust",
    docs: "Docs",
  },
  es: {
    home: "Inicio",
    roadbook: "Ruta",
    worldRules: "Reglas",
    resources: "Recursos",
    ncm: "NCM",
    ncfm: "NCFM",
    elements: "Elementos",
    fairness: "Equidad",
    proofOfFrontier: "Prueba",
    seed: "Semilla",
    guardians: "Guardianes",
    contracts: "Contratos",
    civilization: "Civilización",
    trust: "Confianza",
    docs: "Docs",
  },
  fr: {
    home: "Accueil",
    roadbook: "Route",
    worldRules: "Règles",
    resources: "Ressources",
    ncm: "NCM",
    ncfm: "NCFM",
    elements: "Éléments",
    fairness: "Équité",
    proofOfFrontier: "Preuve",
    seed: "Seed",
    guardians: "Gardiens",
    contracts: "Contrats",
    civilization: "Civilisation",
    trust: "Confiance",
    docs: "Docs",
  },
  de: {
    home: "Home",
    roadbook: "Roadbook",
    worldRules: "Weltregeln",
    resources: "Ressourcen",
    ncm: "NCM",
    ncfm: "NCFM",
    elements: "Elemente",
    fairness: "Fairness",
    proofOfFrontier: "Proof",
    seed: "Seed",
    guardians: "Guardians",
    contracts: "Contracts",
    civilization: "Zivilisation",
    trust: "Trust",
    docs: "Docs",
  },
  ja: {
    home: "ホーム",
    roadbook: "ロードブック",
    worldRules: "世界ルール",
    resources: "資源",
    ncm: "NCM",
    ncfm: "NCFM",
    elements: "元素",
    fairness: "公平性",
    proofOfFrontier: "証明",
    seed: "Seed",
    guardians: "ガーディアン",
    contracts: "契約",
    civilization: "文明",
    trust: "信頼",
    docs: "ドキュメント",
  },
  ru: {
    home: "Главная",
    roadbook: "План",
    worldRules: "Правила",
    resources: "Ресурсы",
    ncm: "NCM",
    ncfm: "NCFM",
    elements: "Элементы",
    fairness: "Честность",
    proofOfFrontier: "Доказательство",
    seed: "Seed",
    guardians: "Стражи",
    contracts: "Контракты",
    civilization: "Цивилизация",
    trust: "Доверие",
    docs: "Документы",
  },
  ko: {
    home: "홈",
    roadbook: "로드북",
    worldRules: "월드 규칙",
    resources: "자원",
    ncm: "NCM",
    ncfm: "NCFM",
    elements: "원소",
    fairness: "공정성",
    proofOfFrontier: "증명",
    seed: "Seed",
    guardians: "가디언",
    contracts: "컨트랙트",
    civilization: "문명",
    trust: "신뢰",
    docs: "문서",
  },
  "zh-Hant": {
    home: "首頁",
    roadbook: "路書",
    worldRules: "世界規則",
    resources: "資源",
    ncm: "NCM",
    ncfm: "NCFM",
    elements: "元素",
    fairness: "公平性",
    proofOfFrontier: "證明",
    seed: "種子",
    guardians: "守護者",
    contracts: "合約",
    civilization: "文明",
    trust: "信任",
    docs: "文檔",
  },
  "zh-Hans": {
    home: "首页",
    roadbook: "路书",
    worldRules: "世界规则",
    resources: "资源",
    ncm: "NCM",
    ncfm: "NCFM",
    elements: "元素",
    fairness: "公平性",
    proofOfFrontier: "证明",
    seed: "种子",
    guardians: "守护者",
    contracts: "合约",
    civilization: "文明",
    trust: "信任",
    docs: "文档",
  },
};

function ensureUnifiedNavigation() {
  document.querySelectorAll(".site-header .nav-links").forEach((container) => {
    const existingLinks = new Map();
    container.querySelectorAll("a[href]").forEach((link) => {
      const path = normalizePath(link.getAttribute("href"));
      existingLinks.set(path, link);
    });

    const orderedLinks = unifiedNavItems.map((item) => {
      const path = normalizePath(item.href);
      const link = existingLinks.get(path) || document.createElement("a");
      link.href = item.href;
      link.dataset.siteNavKey = item.key;
      link.classList.toggle("active", isActiveNavPath(path));
      if (!link.textContent?.trim()) link.textContent = navLabel(item.key);
      return link;
    });

    container.replaceChildren(...orderedLinks);
  });

  updateUnifiedNavigationLabels();

  if ("MutationObserver" in window && !window.__nicechunkNavLanguageObserver) {
    const observer = new MutationObserver(updateUnifiedNavigationLabels);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    window.__nicechunkNavLanguageObserver = observer;
  }
}

function ensureUnifiedFooter() {
  const existingFooter = document.querySelector(".nicechunk-site-footer, footer.site-footer");
  const footer = existingFooter || document.createElement("footer");
  footer.className = "site-footer nicechunk-site-footer";
  footer.dataset.ncUnifiedFooter = "true";
  footer.classList.toggle("nicechunk-site-footer-floating", isImmersiveFooterPage());

  const brand = createFooterBrand();
  const primaryNav = document.createElement("nav");
  primaryNav.className = "nicechunk-footer-links";
  setFooterAriaI18n(primaryNav, "siteFooter.navigationAria", "Footer navigation");
  primaryNav.replaceChildren(
    ...footerPrimaryLinks.map((item) => {
      const link = document.createElement("a");
      link.href = item.href;
      setFooterTextI18n(link, `siteFooter.${item.key}`, footerFallbackLabel(item.key));
      return link;
    }),
  );

  const socialNav = document.createElement("nav");
  socialNav.className = "nicechunk-footer-social";
  setFooterAriaI18n(socialNav, "siteFooter.socialAria", "NiceChunk social links");
  socialNav.replaceChildren(
    ...footerSocialLinks.map((item) => {
      const link = document.createElement("a");
      link.href = item.href;
      link.target = "_blank";
      link.rel = "noreferrer";
      setFooterTextI18n(link, `siteFooter.${item.key}`, footerFallbackLabel(item.key));
      setFooterAriaI18n(link, `siteFooter.${item.key}`, footerFallbackLabel(item.key));
      return link;
    }),
  );

  const meta = document.createElement("p");
  meta.className = "nicechunk-footer-meta";
  setFooterTextI18n(meta, "siteFooter.copyright", "2026 NiceChunk. All rights reserved.");

  footer.replaceChildren(brand, primaryNav, socialNav, meta);

  const target = findFooterInsertionTarget();
  if (target === document.body) {
    if (footer.parentElement !== document.body) document.body.append(footer);
  } else if (footer.parentElement !== document.body || footer.previousElementSibling !== target) {
    target.insertAdjacentElement("afterend", footer);
  }
}

function findFooterInsertionTarget() {
  const main = document.querySelector("main:last-of-type");
  if (!main) return document.body;
  let target = main;
  while (target.parentElement && target.parentElement !== document.body) {
    target = target.parentElement;
  }
  return target;
}

function createFooterBrand() {
  const wrapper = document.createElement("div");
  wrapper.className = "nicechunk-footer-brand";
  const link = document.createElement("a");
  link.className = "brand-mark";
  link.href = "/";
  link.setAttribute("aria-label", "NiceChunk");

  const image = document.createElement("img");
  image.src = "/media/nck.png";
  image.alt = "";

  const name = document.createElement("span");
  name.textContent = "NICECHUNK";

  const tagline = document.createElement("p");
  setFooterTextI18n(tagline, "siteFooter.tagline", "A seeded voxel world protocol on Solana.");

  link.append(image, name);
  wrapper.append(link, tagline);
  return wrapper;
}

function setFooterTextI18n(element, key, fallback) {
  footerI18nAttributes.forEach((attribute) => {
    element.setAttribute(attribute, key);
  });
  element.textContent = fallback;
}

function setFooterAriaI18n(element, key, fallback) {
  footerAriaI18nAttributes.forEach((attribute) => {
    element.setAttribute(attribute, key);
  });
  element.setAttribute("aria-label", fallback);
}

function footerFallbackLabel(key) {
  const labels = {
    home: "Home",
    play: "Enter World",
    roadmap: "Roadbook",
    docs: "Docs",
    guardian: "Guardians",
    contracts: "Contracts",
    x: "X / Twitter",
    github: "GitHub",
  };
  return labels[key] || key;
}

function isImmersiveFooterPage() {
  return ["/play/", "/mining/", "/forging/", "/player_set/"].includes(normalizePath(window.location.pathname));
}

function updateUnifiedNavigationLabels() {
  document.querySelectorAll("[data-site-nav-key]").forEach((link) => {
    link.textContent = navLabel(link.dataset.siteNavKey);
    link.classList.toggle("active", isActiveNavPath(normalizePath(link.getAttribute("href"))));
  });
}

function navLabel(key) {
  const language = normalizeSiteLanguage(
    document.documentElement.lang || window.localStorage?.getItem("nicechunk.language") || navigator.language,
  );
  return unifiedNavLabels[language]?.[key] || unifiedNavLabels.en[key] || key;
}

function normalizeSiteLanguage(language) {
  if (!language) return "en";
  if (language === "zh" || language === "zh-CN" || language === "zh-SG") return "zh-Hans";
  if (language === "zh-TW" || language === "zh-HK" || language === "zh-MO") return "zh-Hant";
  if (unifiedNavLabels[language]) return language;
  const base = language.split("-")[0];
  return unifiedNavLabels[base] ? base : "en";
}

function normalizePath(href) {
  const url = new URL(href || "/", window.location.origin);
  if (url.pathname === "/index.html") return "/";
  if (url.pathname === "/") return "/";
  return url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
}

function isActiveNavPath(path) {
  const current = normalizePath(window.location.pathname);
  const activePath = navActiveAliases[current] || current;
  return path === "/" ? activePath === "/" : activePath === path || activePath.startsWith(path);
}

function installMobileMenu() {
  const header = document.querySelector(".site-header");
  const nav = header?.querySelector(".site-nav, .top-nav");
  if (!header || !nav || header.querySelector(".site-menu-toggle")) return;

  if (!nav.id) {
    nav.id = "sitePrimaryNav";
  }

  const button = document.createElement("button");
  button.className = "site-menu-toggle";
  button.type = "button";
  button.setAttribute("aria-label", "Menu");
  button.setAttribute("aria-controls", nav.id);
  button.setAttribute("aria-expanded", "false");
  button.innerHTML = '<span></span><span></span><span></span>';
  header.insertBefore(button, nav);

  const closeButton = document.createElement("button");
  closeButton.className = "site-menu-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close menu");
  closeButton.innerHTML = '<span></span><span></span>';
  nav.prepend(closeButton);

  button.addEventListener("click", () => {
    const open = !header.classList.contains("mobile-menu-open");
    setMobileMenuOpen(open);
  });

  closeButton.addEventListener("click", () => {
    setMobileMenuOpen(false);
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest?.("a[href]")) {
      setMobileMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMobileMenuOpen(false);
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!header.classList.contains("mobile-menu-open")) return;
    if (!window.matchMedia("(max-width: 760px)").matches) return;
    if (event.target.closest?.(".site-nav, .top-nav, .site-menu-toggle")) return;
    setMobileMenuOpen(false);
  });

  window.addEventListener("resize", () => {
    if (!window.matchMedia("(max-width: 760px)").matches) {
      setMobileMenuOpen(false);
    }
  }, { passive: true });
}

function setMobileMenuOpen(open) {
  const header = document.querySelector(".site-header");
  const button = header?.querySelector(".site-menu-toggle");
  if (!header || !button) return;
  header.classList.toggle("mobile-menu-open", open);
  document.documentElement.classList.toggle("site-mobile-menu-open", open);
  button.setAttribute("aria-expanded", open ? "true" : "false");
  window.setTimeout(updateHeaderMetrics, 40);
  window.setTimeout(updateHeaderMetrics, 180);
}

function installHeaderMetrics() {
  updateHeaderMetrics();
  window.addEventListener("resize", updateHeaderMetrics, { passive: true });
  window.addEventListener("orientationchange", () => {
    window.setTimeout(updateHeaderMetrics, 80);
    window.setTimeout(updateHeaderMetrics, 260);
  });

  if ("ResizeObserver" in window) {
    const header = document.querySelector(".site-header");
    if (header) {
      const observer = new ResizeObserver(updateHeaderMetrics);
      observer.observe(header);
      window.__nicechunkHeaderObserver = observer;
    }
  }

  window.setTimeout(updateHeaderMetrics, 120);
  window.setTimeout(updateHeaderMetrics, 500);
}

function updateHeaderMetrics() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const height = Math.ceil(header.getBoundingClientRect().height || 0);
  if (!height) return;
  document.documentElement.style.setProperty("--nc-site-header-px", `${height}px`);

  const toggle = header.querySelector(".site-menu-toggle");
  if (toggle) {
    const headerRect = header.getBoundingClientRect();
    const toggleRect = toggle.getBoundingClientRect();
    const styles = window.getComputedStyle(header);
    const bottomPadding = Number.parseFloat(styles.paddingBottom) || 0;
    const topbarHeight = Math.ceil(toggleRect.bottom - headerRect.top + bottomPadding);
    if (topbarHeight) {
      document.documentElement.style.setProperty("--nc-site-topbar-px", `${topbarHeight}px`);
    }
  }
}

function installRouteLoading() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href]");
    if (!link || !link.closest(".site-nav, .top-nav")) return;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target !== "_self") return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.hash) return;

    event.preventDefault();
    markActiveLink(link);
    document.documentElement.classList.add("site-route-loading");
    startSiteLoading(24);
    setSiteLoadingProgress(42);
    window.setTimeout(() => {
      window.location.href = url.href;
    }, 80);
  });
}

function markActiveLink(activeLink) {
  activeLink.closest(".site-nav, .top-nav")?.querySelectorAll("a.active").forEach((link) => {
    link.classList.remove("active");
  });
  activeLink.classList.add("active");
}

function ensureProgressBar() {
  if (document.querySelector(".site-loading-bar")) return;
  const bar = document.createElement("div");
  bar.className = "site-loading-bar";
  bar.setAttribute("aria-hidden", "true");
  bar.innerHTML = "<span></span>";
  document.body?.prepend(bar);
}

function updateProgressBar() {
  const fill = document.querySelector(".site-loading-bar span");
  if (!fill) return;
  fill.style.transform = `scaleX(${Math.max(0, Math.min(1, loadingState.value / 100))})`;
}

installSiteUi();
