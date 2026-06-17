/* global __BUILD_VERSION__ */

export const languageOrder = ["en", "es", "fr", "de", "ja", "ru", "ko", "zh-Hant", "zh-Hans"];

export const languages = [
  { code: "en", key: "en", englishName: "English" },
  { code: "es", key: "es", englishName: "Spanish" },
  { code: "fr", key: "fr", englishName: "French" },
  { code: "de", key: "de", englishName: "German" },
  { code: "ja", key: "ja", englishName: "Japanese" },
  { code: "ru", key: "ru", englishName: "Russian" },
  { code: "ko", key: "ko", englishName: "Korean" },
  { code: "zh-Hant", key: "zhHant", englishName: "Traditional Chinese" },
  { code: "zh-Hans", key: "zhHans", englishName: "Simplified Chinese" },
];

const languageCodes = new Set(languageOrder);
const enabledLanguageFallback = new Set(["en", "zh-Hans"]);
const defaultI18nConfig = {
  mainnetKey: "i18n",
  localeBase: "/locales",
  storageKeys: {
    language: "nicechunk.language",
    localeVersionPrefix: "nicechunk.locale.version.",
    localeDataPrefix: "nicechunk.locale.data.",
  },
};
const scopedI18nConfig = {
  elements: {
    mainnetKey: "elementsI18n",
    localeBase: "/elements/locales",
    storageKeys: {
      language: "nicechunk.language",
      localeVersionPrefix: "nicechunk.elements.locale.version.",
      localeDataPrefix: "nicechunk.elements.locale.data.",
    },
  },
  resourceRule: {
    mainnetKey: "resourceRuleI18n",
    localeBase: "/resource_rule/locales",
    storageKeys: {
      language: "nicechunk.language",
      localeVersionPrefix: "nicechunk.resourceRule.locale.version.",
      localeDataPrefix: "nicechunk.resourceRule.locale.data.",
    },
  },
  proofOfFrontier: {
    mainnetKey: "proofOfFrontierI18n",
    localeBase: "/proof-of-frontier/locales",
    storageKeys: {
      language: "nicechunk.language",
      localeVersionPrefix: "nicechunk.proofOfFrontier.locale.version.",
      localeDataPrefix: "nicechunk.proofOfFrontier.locale.data.",
    },
  },
};
const pageI18nScope = detectPageI18nScope();
const activeI18nConfig = scopedI18nConfig[pageI18nScope] ?? defaultI18nConfig;
const languageStorageKey = activeI18nConfig.storageKeys.language;
const localeVersionPrefix = activeI18nConfig.storageKeys.localeVersionPrefix;
const localeDataPrefix = activeI18nConfig.storageKeys.localeDataPrefix;
const defaultLanguage = "en";
const buildVersion = typeof __BUILD_VERSION__ === "string" ? __BUILD_VERSION__ : String(Date.now());

let activeLanguage = normalizeLanguage(localStorage.getItem(languageStorageKey)) || defaultLanguage;
let activeDictionary = {};
let fallbackDictionary = {};
let fallbackDictionaryPromise = null;
let mainnetIndex = null;
let readyPromise = null;

function detectPageI18nScope() {
  if (typeof document === "undefined") return "";
  return document.documentElement?.dataset?.i18nScope || document.body?.dataset?.i18nScope || "";
}

export async function initI18n(root = document) {
  if (!readyPromise) readyPromise = loadLanguage(activeLanguage);
  await readyPromise;
  setupLanguageControls(root);
  applyTranslations(root);
  return { language: activeLanguage, dictionary: activeDictionary };
}

export function currentLanguage() {
  return activeLanguage;
}

export async function setLanguage(language, root = document) {
  const nextLanguage = normalizeLanguage(language) || defaultLanguage;
  localStorage.setItem(languageStorageKey, nextLanguage);
  if (nextLanguage === activeLanguage && Object.keys(activeDictionary).length) {
    applyTranslations(root);
    return activeLanguage;
  }

  activeLanguage = nextLanguage;
  readyPromise = loadLanguage(activeLanguage);
  await readyPromise;
  applyTranslations(root);
  window.dispatchEvent(new CustomEvent("nicechunk:languagechange", { detail: { language: activeLanguage } }));
  return activeLanguage;
}

export function t(key, params = {}) {
  const template = getByPath(activeDictionary, key) ?? getByPath(fallbackDictionary, key) ?? key;
  return interpolate(String(template), params);
}

export function applyTranslations(root = document) {
  document.documentElement.lang = activeLanguage;
  setupLanguageControls(root);

  root.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  translateAttribute(root, "data-i18n-title", "title");
  translateAttribute(root, "data-i18n-placeholder", "placeholder");
  translateAttribute(root, "data-i18n-aria-label", "aria-label");
  translateAttribute(root, "data-i18n-label", "label");
  translateAttribute(root, "data-i18n-value", "value");
}

export function setupLanguageControls(root = document) {
  root.querySelectorAll("select[data-i18n-language-select]").forEach((select) => {
    if (!select.dataset.i18nReady) {
      select.replaceChildren(
        ...languages.map((language) => {
          const option = document.createElement("option");
          option.value = language.code;
          option.textContent = languageOptionLabel(language);
          option.disabled = !isLanguageAvailable(language.code);
          return option;
        }),
      );
      select.addEventListener("change", () => setLanguage(select.value));
      select.dataset.i18nReady = "true";
    }
    select.value = activeLanguage;
    select.setAttribute("aria-label", t("common.language"));
    select.title = t("common.language");
  });

  root.querySelectorAll("[data-i18n-language-menu]").forEach((menu) => {
    setupLanguageMenu(menu);
  });
}

function translateAttribute(root, dataName, attributeName) {
  root.querySelectorAll(`[${dataName}]`).forEach((element) => {
    element.setAttribute(attributeName, t(element.getAttribute(dataName)));
  });
}

function setupLanguageMenu(menu) {
  if (!menu.dataset.i18nReady) {
    const trigger = document.createElement("button");
    trigger.className = "language-trigger";
    trigger.type = "button";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML = `
      <span class="language-current"></span>
      <span class="language-caret" aria-hidden="true"></span>
    `;

    const list = document.createElement("div");
    list.className = "language-menu";
    list.setAttribute("role", "listbox");

    languages.forEach((language) => {
      const option = document.createElement("button");
      option.className = "language-option";
      option.type = "button";
      option.dataset.language = language.code;
      option.setAttribute("role", "option");
      option.innerHTML = `
        <span class="language-option-name"></span>
        <span class="language-option-native"></span>
        <span class="language-option-status"></span>
      `;
      option.addEventListener("click", async () => {
        if (!isLanguageAvailable(language.code)) return;
        closeLanguageMenu(menu);
        await setLanguage(language.code);
      });
      list.append(option);
    });

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = menu.classList.toggle("open");
      trigger.setAttribute("aria-expanded", String(open));
    });

    menu.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeLanguageMenu(menu);
    });

    document.addEventListener("click", (event) => {
      if (!menu.contains(event.target)) closeLanguageMenu(menu);
    });

    menu.classList.add("language-picker");
    menu.replaceChildren(trigger, list);
    menu.dataset.i18nReady = "true";
  }

  updateLanguageMenu(menu);
}

function updateLanguageMenu(menu) {
  const trigger = menu.querySelector(".language-trigger");
  const current = menu.querySelector(".language-current");
  const active = languages.find((language) => language.code === activeLanguage) ?? languages[0];

  if (trigger) {
    trigger.setAttribute("aria-label", t("common.language"));
    trigger.title = t("common.language");
  }
  if (current) current.textContent = languageOptionLabel(active);

  menu.querySelectorAll(".language-option").forEach((option) => {
    const language = languages.find((item) => item.code === option.dataset.language);
    if (!language) return;
    option.querySelector(".language-option-name").textContent = language.englishName;
    option.querySelector(".language-option-native").textContent = `(${languageNativeName(language)})`;
    option.querySelector(".language-option-status").textContent = isLanguageAvailable(language.code) ? "" : comingSoonLabel();
    option.disabled = !isLanguageAvailable(language.code);
    option.classList.toggle("active", language.code === activeLanguage);
    option.setAttribute("aria-selected", String(language.code === activeLanguage));
  });
}

function closeLanguageMenu(menu) {
  menu.classList.remove("open");
  menu.querySelector(".language-trigger")?.setAttribute("aria-expanded", "false");
}

function languageOptionLabel(language) {
  return `${language.englishName} (${languageNativeName(language)})`;
}

function languageNativeName(language) {
  return t(`common.languageNative.${language.key}`);
}

function comingSoonLabel() {
  const value = t("common.comingSoon");
  return value === "common.comingSoon" ? "Coming Soon" : value;
}

function isLanguageAvailable(language) {
  const scopedIndex = mainnetIndex?.[activeI18nConfig.mainnetKey] ?? mainnetIndex?.i18n;
  if (scopedIndex?.locales) return Boolean(scopedIndex.locales[language]);
  return enabledLanguageFallback.has(language);
}

async function loadLanguage(language) {
  try {
    activeDictionary = await loadDictionary(language);
    if (language === defaultLanguage) {
      fallbackDictionary = activeDictionary;
      fallbackDictionaryPromise = Promise.resolve(fallbackDictionary);
    } else {
      await ensureFallbackDictionary();
    }
  } catch (error) {
    if (language === defaultLanguage) throw error;
    activeLanguage = defaultLanguage;
    localStorage.setItem(languageStorageKey, activeLanguage);
    activeDictionary = await loadDictionary(defaultLanguage);
    fallbackDictionary = activeDictionary;
    fallbackDictionaryPromise = Promise.resolve(fallbackDictionary);
  }
  document.documentElement.lang = activeLanguage;
  return activeDictionary;
}

async function ensureFallbackDictionary() {
  if (Object.keys(fallbackDictionary).length) return fallbackDictionary;
  if (!fallbackDictionaryPromise) {
    fallbackDictionaryPromise = loadDictionary(defaultLanguage)
      .then((dictionary) => {
        fallbackDictionary = dictionary;
        return fallbackDictionary;
      })
      .catch((error) => {
        fallbackDictionaryPromise = null;
        throw error;
      });
  }
  return fallbackDictionaryPromise;
}

async function loadDictionary(language) {
  const mainnet = await fetchMainnetIndex().catch(() => null);
  const scopedIndex = mainnet?.[activeI18nConfig.mainnetKey] ?? mainnet?.i18n;
  const remoteLocale = scopedIndex?.locales?.[language];
  if (scopedIndex?.locales && !remoteLocale) throw new Error(`Locale is not published: ${language}`);
  const cached = readCachedDictionary(language, remoteLocale?.version);
  if (cached) return cached;

  const dictionary = await fetchDictionary(language, remoteLocale);
  writeCachedDictionary(language, dictionary, remoteLocale?.version ?? dictionary?._meta?.version ?? buildVersion);
  return dictionary;
}

async function fetchMainnetIndex() {
  if (mainnetIndex) return mainnetIndex;
  const response = await fetch(`/mainnet.json?v=${encodeURIComponent(buildVersion)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to load mainnet index");
  mainnetIndex = await response.json();
  return mainnetIndex;
}

async function fetchDictionary(language, remoteLocale = null) {
  const url = remoteLocale?.url || `${activeI18nConfig.localeBase}/${language}.json`;
  const version = remoteLocale?.version || buildVersion;
  const response = await fetch(`${url}?v=${encodeURIComponent(version)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to load locale ${language}`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) throw new Error(`Locale ${language} did not return JSON`);
  return response.json();
}

function readCachedDictionary(language, expectedVersion) {
  if (!expectedVersion) return null;
  const cachedVersion = localStorage.getItem(localeVersionKey(language));
  if (cachedVersion !== expectedVersion) return null;
  const raw = localStorage.getItem(localeDataKey(language));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    localStorage.removeItem(localeVersionKey(language));
    localStorage.removeItem(localeDataKey(language));
    return null;
  }
}

function writeCachedDictionary(language, dictionary, version) {
  if (!version || !dictionary) return;
  try {
    localStorage.setItem(localeVersionKey(language), version);
    localStorage.setItem(localeDataKey(language), JSON.stringify(dictionary));
  } catch (_error) {
    localStorage.removeItem(localeDataKey(language));
  }
}

function localeVersionKey(language) {
  return `${localeVersionPrefix}${language}`;
}

function localeDataKey(language) {
  return `${localeDataPrefix}${language}`;
}

function normalizeLanguage(language) {
  if (!language) return "";
  const normalized = String(language).trim();
  if (languageCodes.has(normalized)) return normalized;
  const lower = normalized.toLowerCase();
  if (lower === "zh-tw" || lower === "zh-hk" || lower === "zh-mo" || lower === "zh-hant") return "zh-Hant";
  if (lower === "zh" || lower === "zh-cn" || lower === "zh-sg" || lower === "zh-hans") return "zh-Hans";
  const prefix = lower.split("-")[0];
  return languageOrder.find((code) => code.toLowerCase() === prefix) || "";
}

function getByPath(source, path) {
  return path.split(".").reduce((value, part) => (value && Object.hasOwn(value, part) ? value[part] : undefined), source);
}

function interpolate(template, params) {
  return template.replace(/\{(\w+)\}/g, (_match, key) => (Object.hasOwn(params, key) ? String(params[key]) : `{${key}}`));
}
