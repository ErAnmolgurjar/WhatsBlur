const LEGACY_KEY = "wa_styler_enabled";
const KEY_MESSAGES = "blur_all_messages";
const KEY_CONTACTS = "blur_all_contacts";
const KEY_PROFILES = "hide_profile_pictures";
const KEY_INT_MESSAGES = "blur_intensity_messages";
const KEY_INT_CONTACTS = "blur_intensity_contacts";
const KEY_INT_PROFILES = "blur_intensity_profiles";
const KEY_HOVER_MESSAGES = "unblur_hover_messages";
const KEY_HOVER_CONTACTS = "unblur_hover_contacts";
const KEY_HOVER_PROFILES = "unblur_hover_profiles";

const INT_MIN = 0;
const INT_MAX = 20;
const DEFAULT_INT_MESSAGES = 6;
const DEFAULT_INT_CONTACTS = 5;
const DEFAULT_INT_PROFILES = 8;

const toggleMessages = document.getElementById("toggle-messages");
const toggleContacts = document.getElementById("toggle-contacts");
const toggleProfiles = document.getElementById("toggle-profiles");
const sliderMessages = document.getElementById("slider-messages");
const sliderContacts = document.getElementById("slider-contacts");
const sliderProfiles = document.getElementById("slider-profiles");
const hoverMessages = document.getElementById("hover-messages");
const hoverContacts = document.getElementById("hover-contacts");
const hoverProfiles = document.getElementById("hover-profiles");
const valMessages = document.getElementById("val-messages");
const valContacts = document.getElementById("val-contacts");
const valProfiles = document.getElementById("val-profiles");
const statusText = document.getElementById("status-text");
const statusDot = document.getElementById("status-dot");
const card = document.getElementById("card");

function clampToRange(n, fallback) {
  const v = Math.round(Number(n));
  if (Number.isNaN(v)) return fallback;
  return Math.min(INT_MAX, Math.max(INT_MIN, v));
}

function normalizeBooleans(result) {
  let messages = result[KEY_MESSAGES];
  let contacts = result[KEY_CONTACTS];
  let profiles = result[KEY_PROFILES];

  const hasNew =
    messages !== undefined || contacts !== undefined || profiles !== undefined;
  if (!hasNew && result[LEGACY_KEY] !== undefined) {
    const legacyOn = result[LEGACY_KEY] !== false;
    messages = legacyOn;
    contacts = false;
    profiles = false;
    chrome.storage.local.set({
      [KEY_MESSAGES]: messages,
      [KEY_CONTACTS]: contacts,
      [KEY_PROFILES]: profiles,
    });
    chrome.storage.local.remove(LEGACY_KEY);
  }

  if (messages === undefined) messages = true;
  if (contacts === undefined) contacts = false;
  if (profiles === undefined) profiles = false;

  return {
    messages: !!messages,
    contacts: !!contacts,
    profiles: !!profiles,
  };
}

function readHoverFlags(result) {
  return {
    hoverMessages: !!result[KEY_HOVER_MESSAGES],
    hoverContacts: !!result[KEY_HOVER_CONTACTS],
    hoverProfiles: !!result[KEY_HOVER_PROFILES],
  };
}

function readIntensities(result) {
  let im = result[KEY_INT_MESSAGES];
  let ic = result[KEY_INT_CONTACTS];
  let ip = result[KEY_INT_PROFILES];
  if (im === undefined) im = DEFAULT_INT_MESSAGES;
  if (ic === undefined) ic = DEFAULT_INT_CONTACTS;
  if (ip === undefined) ip = DEFAULT_INT_PROFILES;
  return {
    messagesPx: clampToRange(im, DEFAULT_INT_MESSAGES),
    contactsPx: clampToRange(ic, DEFAULT_INT_CONTACTS),
    profilesPx: clampToRange(ip, DEFAULT_INT_PROFILES),
  };
}

function updateIntensityLabels() {
  const im = clampToRange(sliderMessages.value, DEFAULT_INT_MESSAGES);
  const ic = clampToRange(sliderContacts.value, DEFAULT_INT_CONTACTS);
  const ip = clampToRange(sliderProfiles.value, DEFAULT_INT_PROFILES);
  valMessages.textContent = `${im} px`;
  valContacts.textContent = `${ic} px`;
  valProfiles.textContent = `${ip} px`;
}

function updateUI(
  messages,
  contacts,
  profiles,
  messagesPx,
  contactsPx,
  profilesPx,
  hoverMsg,
  hoverCon,
  hoverProf
) {
  toggleMessages.checked = messages;
  toggleContacts.checked = contacts;
  toggleProfiles.checked = profiles;
  sliderMessages.value = String(messagesPx);
  sliderContacts.value = String(contactsPx);
  sliderProfiles.value = String(profilesPx);
  hoverMessages.checked = hoverMsg;
  hoverContacts.checked = hoverCon;
  hoverProfiles.checked = hoverProf;
  updateIntensityLabels();

  const anyOn = messages || contacts || profiles;
  if (anyOn) {
    statusText.textContent = "Privacy on";
    statusDot.classList.add("active");
    card.classList.add("theme-on");
  } else {
    statusText.textContent = "All off";
    statusDot.classList.remove("active");
    card.classList.remove("theme-on");
  }
}

function currentSnapshot() {
  return {
    messages: toggleMessages.checked,
    contacts: toggleContacts.checked,
    profiles: toggleProfiles.checked,
    messagesPx: clampToRange(sliderMessages.value, DEFAULT_INT_MESSAGES),
    contactsPx: clampToRange(sliderContacts.value, DEFAULT_INT_CONTACTS),
    profilesPx: clampToRange(sliderProfiles.value, DEFAULT_INT_PROFILES),
    hoverMessages: hoverMessages.checked,
    hoverContacts: hoverContacts.checked,
    hoverProfiles: hoverProfiles.checked,
  };
}

function broadcastToWhatsAppTabs(snapshot) {
  const payload = {
    type: "UPDATE_BLUR",
    blur_all_messages: snapshot.messages,
    blur_all_contacts: snapshot.contacts,
    hide_profile_pictures: snapshot.profiles,
    blur_intensity_messages: snapshot.messagesPx,
    blur_intensity_contacts: snapshot.contactsPx,
    blur_intensity_profiles: snapshot.profilesPx,
    unblur_hover_messages: snapshot.hoverMessages,
    unblur_hover_contacts: snapshot.hoverContacts,
    unblur_hover_profiles: snapshot.hoverProfiles,
  };
  chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, payload, () => void chrome.runtime.lastError);
    });
  });
}

function persistAndSync(snapshot) {
  chrome.storage.local.set({
    [KEY_MESSAGES]: snapshot.messages,
    [KEY_CONTACTS]: snapshot.contacts,
    [KEY_PROFILES]: snapshot.profiles,
    [KEY_INT_MESSAGES]: snapshot.messagesPx,
    [KEY_INT_CONTACTS]: snapshot.contactsPx,
    [KEY_INT_PROFILES]: snapshot.profilesPx,
    [KEY_HOVER_MESSAGES]: snapshot.hoverMessages,
    [KEY_HOVER_CONTACTS]: snapshot.hoverContacts,
    [KEY_HOVER_PROFILES]: snapshot.hoverProfiles,
  });
  updateUI(
    snapshot.messages,
    snapshot.contacts,
    snapshot.profiles,
    snapshot.messagesPx,
    snapshot.contactsPx,
    snapshot.profilesPx,
    snapshot.hoverMessages,
    snapshot.hoverContacts,
    snapshot.hoverProfiles
  );
  broadcastToWhatsAppTabs(snapshot);
}

chrome.storage.local.get(
  [
    KEY_MESSAGES,
    KEY_CONTACTS,
    KEY_PROFILES,
    KEY_INT_MESSAGES,
    KEY_INT_CONTACTS,
    KEY_INT_PROFILES,
    KEY_HOVER_MESSAGES,
    KEY_HOVER_CONTACTS,
    KEY_HOVER_PROFILES,
    LEGACY_KEY,
  ],
  (result) => {
    const { messages, contacts, profiles } = normalizeBooleans(result);
    const { messagesPx, contactsPx, profilesPx } = readIntensities(result);
    const { hoverMessages: hm, hoverContacts: hc, hoverProfiles: hp } = readHoverFlags(result);
    updateUI(messages, contacts, profiles, messagesPx, contactsPx, profilesPx, hm, hc, hp);
  }
);

toggleMessages.addEventListener("change", () => persistAndSync(currentSnapshot()));
toggleContacts.addEventListener("change", () => persistAndSync(currentSnapshot()));
toggleProfiles.addEventListener("change", () => persistAndSync(currentSnapshot()));

hoverMessages.addEventListener("change", () => persistAndSync(currentSnapshot()));
hoverContacts.addEventListener("change", () => persistAndSync(currentSnapshot()));
hoverProfiles.addEventListener("change", () => persistAndSync(currentSnapshot()));

sliderMessages.addEventListener("input", () => {
  updateIntensityLabels();
  persistAndSync(currentSnapshot());
});

sliderContacts.addEventListener("input", () => {
  updateIntensityLabels();
  persistAndSync(currentSnapshot());
});

sliderProfiles.addEventListener("input", () => {
  updateIntensityLabels();
  persistAndSync(currentSnapshot());
});

document.getElementById("open-wa").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://web.whatsapp.com" });
});
