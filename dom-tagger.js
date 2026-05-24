// WhatsBlur — tags chat rows using WhatsApp's stable data-testid attributes.

const WB_ATTR = "data-whatsblur";

let observer = null;
let bootObserver = null;
let scrollTarget = null;
let debounceTimer = null;
let retryTimer = null;
let taggingEnabled = false;
let scrollHandler = null;

function getChatList() {
  const pane = document.querySelector("#pane-side");
  if (!pane) return null;
  return pane.querySelector('[aria-label="Chat list"]') || pane;
}

function getChatRows() {
  const list = getChatList();
  if (!list) return [];
  return [...list.querySelectorAll('[role="row"][data-testid^="list-item-"]')];
}

function isVisible(el) {
  if (!el || el.nodeType !== 1) return false;
  const r = el.getBoundingClientRect();
  return r.width > 2 && r.height > 2;
}

function findProfileImg(row) {
  const imgs = [...row.querySelectorAll("img[src]")].filter(isVisible);
  if (!imgs.length) return null;
  imgs.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
  return imgs[0];
}

function tagChatRow(row) {
  const want = new Map();

  const title = row.querySelector('[data-testid="cell-frame-title"]');
  const label = row.querySelector('[data-testid="cell-frame-label"]');
  const secondary = row.querySelector('[data-testid="cell-frame-secondary"]');
  const profile = findProfileImg(row);

  if (title) want.set(title, "contact");
  if (label) want.set(label, "contact");
  if (secondary) want.set(secondary, "message");
  if (profile) want.set(profile, "profile");

  for (const [el, kind] of want) {
    el.setAttribute(WB_ATTR, kind);
  }

  row.querySelectorAll(`[${WB_ATTR}]`).forEach((el) => {
    if (!want.has(el)) el.removeAttribute(WB_ATTR);
  });
}

function tagAll() {
  if (!taggingEnabled) return;
  getChatRows().forEach(tagChatRow);
}

function scheduleTag() {
  if (!taggingEnabled) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    tagAll();
  }, 300);
}

function findScrollParent(el) {
  let node = el;
  while (node && node !== document.body) {
    const style = getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 4) {
      return node;
    }
    node = node.parentElement;
  }
  return el;
}

function attachScrollListener(root) {
  if (scrollHandler) {
    scrollTarget?.removeEventListener("scroll", scrollHandler);
  }
  scrollTarget = findScrollParent(root);
  scrollHandler = () => scheduleTag();
  scrollTarget.addEventListener("scroll", scrollHandler, { passive: true });
}

function attachObserver(root) {
  if (observer) observer.disconnect();
  observer = new MutationObserver(() => scheduleTag());
  observer.observe(root, { childList: true, subtree: true });
}

function startRetries() {
  clearInterval(retryTimer);
  let n = 0;
  retryTimer = setInterval(() => {
    if (!taggingEnabled || n++ > 10) {
      clearInterval(retryTimer);
      retryTimer = null;
      return;
    }
    tagAll();
  }, 1000);
}

function startDomTagger() {
  taggingEnabled = true;
  tagAll();
  startRetries();

  const pane = document.querySelector("#pane-side");
  if (pane) {
    attachObserver(pane);
    attachScrollListener(pane);
  } else if (!bootObserver) {
    bootObserver = new MutationObserver(() => {
      const p = document.querySelector("#pane-side");
      if (!p) return;
      bootObserver.disconnect();
      bootObserver = null;
      attachObserver(p);
      attachScrollListener(p);
      tagAll();
      startRetries();
    });
    bootObserver.observe(document.body, { childList: true, subtree: true });
  }
}

function stopDomTagger() {
  taggingEnabled = false;
  clearTimeout(debounceTimer);
  debounceTimer = null;
  clearInterval(retryTimer);
  retryTimer = null;

  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (bootObserver) {
    bootObserver.disconnect();
    bootObserver = null;
  }
  if (scrollHandler) {
    scrollTarget?.removeEventListener("scroll", scrollHandler);
    scrollHandler = null;
    scrollTarget = null;
  }

  document.querySelectorAll(`[${WB_ATTR}]`).forEach((el) => el.removeAttribute(WB_ATTR));
}

function syncDomTagger(messages, contacts, profiles) {
  if (messages || contacts || profiles) {
    startDomTagger();
  } else {
    stopDomTagger();
  }
}
