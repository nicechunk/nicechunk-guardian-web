const loadingState = {
  active: false,
  value: 0,
  timer: 0,
};

installSiteUi();

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
