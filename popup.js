const STORAGE_KEY = "wa_styler_enabled";
const toggle = document.getElementById("toggle");
const statusText = document.getElementById("status-text");
const statusDot = document.getElementById("status-dot");
const card = document.getElementById("card");

function updateUI(enabled) {
  toggle.checked = enabled;
  if (enabled) {
    statusText.textContent = "Theme Active";
    statusDot.classList.add("active");
    card.classList.add("theme-on");
  } else {
    statusText.textContent = "Theme Off";
    statusDot.classList.remove("active");
    card.classList.remove("theme-on");
  }
}

// Load current state
chrome.storage.local.get([STORAGE_KEY], (result) => {
  const enabled = result[STORAGE_KEY] !== false;
  updateUI(enabled);
});

// Handle toggle change
toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  chrome.storage.local.set({ [STORAGE_KEY]: enabled });
  updateUI(enabled);

  // Send message to active WhatsApp Web tabs
  chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, (tabs) => {
    if (chrome.runtime.lastError) {
      return;
    }

    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_STYLE", enabled }, () => {
        if (chrome.runtime.lastError) {
          return;
        }
      });
    });
  });
});

// Open WhatsApp Web button
document.getElementById("open-wa").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://web.whatsapp.com" });
});
