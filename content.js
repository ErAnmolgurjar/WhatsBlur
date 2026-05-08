// WhatsApp Web Styler — Content Script

const STORAGE_KEY = "wa_styler_enabled";
const STYLE_ID = "wa-custom-styler-link";

function injectStylesheet() {
  if (document.getElementById(STYLE_ID)) return;

  const link = document.createElement("link");
  link.id = STYLE_ID;
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = chrome.runtime.getURL("styles.css");
  document.head.appendChild(link);
}

function removeStylesheet() {
  const existing = document.getElementById(STYLE_ID);
  if (existing) existing.remove();
}

function applyState(enabled) {
  if (enabled) {
    injectStylesheet();
  } else {
    removeStylesheet();
  }
}

// Initial load — check stored preference
chrome.storage.local.get([STORAGE_KEY], (result) => {
  const enabled = result[STORAGE_KEY] !== false; // default ON
  applyState(enabled);
});

// Listen for toggle messages from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TOGGLE_STYLE") {
    applyState(message.enabled);
  }
});
