// WhatsBlur — Content script

const STYLE_ID = "wa-custom-styler-link";
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

const STORAGE_KEYS = [
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
];

function injectStylesheet() {
  if (document.getElementById(STYLE_ID)) return;

  const url = chrome.runtime.getURL("styles.css");
  const link = document.createElement("link");
  link.id = STYLE_ID;
  link.rel = "stylesheet";
  link.href = url;

  const head = document.head || document.documentElement;
  head.appendChild(link);
}

function removeStylesheet() {
  const existing = document.getElementById(STYLE_ID);
  if (existing) existing.remove();
}

function clampToRange(n, fallback) {
  const v = Math.round(Number(n));
  if (Number.isNaN(v)) return fallback;
  return Math.min(INT_MAX, Math.max(INT_MIN, v));
}

function applyIntensity(messagesPx, contactsPx, profilesPx) {
  const mp = clampToRange(messagesPx, DEFAULT_INT_MESSAGES);
  const cp = clampToRange(contactsPx, DEFAULT_INT_CONTACTS);
  const pp = clampToRange(profilesPx, DEFAULT_INT_PROFILES);
  document.documentElement.style.setProperty("--wb-msg-blur", `${mp}px`);
  document.documentElement.style.setProperty("--wb-contact-blur", `${cp}px`);
  document.documentElement.style.setProperty("--wb-profile-blur", `${pp}px`);
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

function applyBlurClasses(messages, contacts, profiles) {
  document.documentElement.classList.toggle("whatsblur-messages", messages);
  document.documentElement.classList.toggle("whatsblur-contacts", contacts);
  document.documentElement.classList.toggle("whatsblur-profiles", profiles);
}

function applyHoverClasses(hoverMessages, hoverContacts, hoverProfiles) {
  document.documentElement.classList.toggle("whatsblur-hover-messages", hoverMessages);
  document.documentElement.classList.toggle("whatsblur-hover-contacts", hoverContacts);
  document.documentElement.classList.toggle("whatsblur-hover-profiles", hoverProfiles);
}

function clearAllClasses() {
  applyBlurClasses(false, false, false);
  applyHoverClasses(false, false, false);
}

function applyState(
  messages,
  contacts,
  profiles,
  messagesPx,
  contactsPx,
  profilesPx,
  hoverMessages,
  hoverContacts,
  hoverProfiles
) {
  applyIntensity(messagesPx, contactsPx, profilesPx);
  applyBlurClasses(messages, contacts, profiles);
  applyHoverClasses(hoverMessages, hoverContacts, hoverProfiles);

  if (messages || contacts || profiles) {
    injectStylesheet();
    syncDomTagger(messages, contacts, profiles);
  } else {
    removeStylesheet();
    clearAllClasses();
    syncDomTagger(false, false, false);
  }
}

function applyFromStorageResult(result) {
  const { messages, contacts, profiles } = normalizeBooleans(result);
  const { messagesPx, contactsPx, profilesPx } = readIntensities(result);
  const { hoverMessages, hoverContacts, hoverProfiles } = readHoverFlags(result);
  applyState(
    messages,
    contacts,
    profiles,
    messagesPx,
    contactsPx,
    profilesPx,
    hoverMessages,
    hoverContacts,
    hoverProfiles
  );
}

function loadAndApply() {
  chrome.storage.local.get(STORAGE_KEYS, applyFromStorageResult);
}

loadAndApply();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (!STORAGE_KEYS.some((k) => Object.prototype.hasOwnProperty.call(changes, k))) return;
  loadAndApply();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "UPDATE_BLUR") return;

  const messages = !!message.blur_all_messages;
  const contacts = !!message.blur_all_contacts;
  const profiles = !!message.hide_profile_pictures;
  const messagesPx =
    message.blur_intensity_messages !== undefined
      ? clampToRange(message.blur_intensity_messages, DEFAULT_INT_MESSAGES)
      : DEFAULT_INT_MESSAGES;
  const contactsPx =
    message.blur_intensity_contacts !== undefined
      ? clampToRange(message.blur_intensity_contacts, DEFAULT_INT_CONTACTS)
      : DEFAULT_INT_CONTACTS;
  const profilesPx =
    message.blur_intensity_profiles !== undefined
      ? clampToRange(message.blur_intensity_profiles, DEFAULT_INT_PROFILES)
      : DEFAULT_INT_PROFILES;
  const hoverMessages = !!message.unblur_hover_messages;
  const hoverContacts = !!message.unblur_hover_contacts;
  const hoverProfiles = !!message.unblur_hover_profiles;

  applyState(
    messages,
    contacts,
    profiles,
    messagesPx,
    contactsPx,
    profilesPx,
    hoverMessages,
    hoverContacts,
    hoverProfiles
  );
});
