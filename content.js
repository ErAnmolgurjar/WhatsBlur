// WhatsApp Web Styler — Content Script

const STORAGE_ENABLED_KEY = "wa_styler_enabled";
const STORAGE_MODE_KEY = "wa_styler_mode";
const STYLE_ID = "wa-custom-styler-link";
const ROOT_ATTRIBUTE = "data-whatsblur-mode";

function injectStylesheet() {
  if (document.getElementById(STYLE_ID)) return;

  const link = document.createElement("link");
  link.id = STYLE_ID;
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = chrome.runtime.getURL("styles.css");

  const parent = document.head || document.documentElement;
  parent.appendChild(link);
}

function removeStylesheet() {
  const existing = document.getElementById(STYLE_ID);
  if (existing) existing.remove();
}

function setMode(mode) {
  document.documentElement.setAttribute(ROOT_ATTRIBUTE, mode);
}

function clearMode() {
  document.documentElement.removeAttribute(ROOT_ATTRIBUTE);
}

function applyState(enabled, mode) {
  if (enabled) {
    injectStylesheet();
    setMode(mode);
  } else {
    removeStylesheet();
    clearMode();
  }
}

// Initial load — check stored preference
chrome.storage.local.get([STORAGE_ENABLED_KEY, STORAGE_MODE_KEY], (result) => {
  const enabled = result[STORAGE_ENABLED_KEY] !== false; // default ON
  const mode = result[STORAGE_MODE_KEY] || "all";
  applyState(enabled, mode);
});

// Listen for toggle messages from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "UPDATE_BLUR_STATE") {
    applyState(message.enabled, message.mode || "all");
  }
});
