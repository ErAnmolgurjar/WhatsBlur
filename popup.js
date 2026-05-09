const STORAGE_ENABLED_KEY = "wa_styler_enabled";
const STORAGE_MODE_KEY = "wa_styler_mode";
const toggle = document.getElementById("toggle");
const statusText = document.getElementById("status-text");
const statusDot = document.getElementById("status-dot");
const card = document.getElementById("card");
const modeInputs = document.querySelectorAll('input[name="blur-mode"]');

function getSelectedMode() {
  const selected = document.querySelector('input[name="blur-mode"]:checked');
  return selected ? selected.value : "all";
}

function setSelectedMode(mode) {
  modeInputs.forEach((input) => {
    input.checked = input.value === mode;
  });
}

function updateUI(enabled, mode) {
  toggle.checked = enabled;
  if (enabled) {
    statusText.textContent = mode === "message" ? "Message Only" : "Everything";
    statusDot.classList.add("active");
    card.classList.add("theme-on");
  } else {
    statusText.textContent = "Theme Off";
    statusDot.classList.remove("active");
    card.classList.remove("theme-on");
  }
}

function broadcastState(enabled, mode) {
  chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, (tabs) => {
    if (chrome.runtime.lastError) {
      return;
    }

    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, {
        type: "UPDATE_BLUR_STATE",
        enabled,
        mode,
      }, () => {
        if (chrome.runtime.lastError) {
          return;
        }
      });
    });
  });
}

// Load current state
chrome.storage.local.get([STORAGE_ENABLED_KEY, STORAGE_MODE_KEY], (result) => {
  const enabled = result[STORAGE_ENABLED_KEY] !== false;
  const mode = result[STORAGE_MODE_KEY] || "all";
  setSelectedMode(mode);
  updateUI(enabled, mode);
});

// Handle toggle change
toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  const mode = getSelectedMode();
  chrome.storage.local.set({ [STORAGE_ENABLED_KEY]: enabled, [STORAGE_MODE_KEY]: mode });
  updateUI(enabled, mode);
  broadcastState(enabled, mode);
});

modeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    const mode = getSelectedMode();
    const enabled = toggle.checked;
    chrome.storage.local.set({ [STORAGE_ENABLED_KEY]: enabled, [STORAGE_MODE_KEY]: mode });
    updateUI(enabled, mode);
    broadcastState(enabled, mode);
  });
});

// Open WhatsApp Web button
document.getElementById("open-wa").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://web.whatsapp.com" });
});
