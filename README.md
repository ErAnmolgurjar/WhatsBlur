# WhatsBlur

A Chrome extension that adds privacy controls to [WhatsApp Web](https://web.whatsapp.com). It blurs sensitive parts of the **chat list** (left sidebar)—message previews, contact names, and profile photos—so your conversations are harder to read at a glance. You choose what to blur, how strong the blur is, and whether items temporarily clear when you hover over them.

**Current version:** 1.3.0

---

## Features

### Blur controls (independent)

Each category can be turned on or off separately from the extension popup:

| Feature | What it blurs |
|--------|----------------|
| **Blur all messages** | Last-message preview line under each chat (e.g. “Hey, are you free?”) |
| **Blur all contacts** | Contact and group names in the chat list |
| **Hide profile pictures** | Avatar images in the chat list |

You can enable any combination—for example, only contact names, or only message previews.

### Adjustable blur strength

Each blur type has its own slider (**0–20 px**):

- **Preview blur strength** — message previews  
- **Contact blur strength** — names and group labels  
- **Profile blur strength** — avatars  

Changes apply live on WhatsApp Web as you move the slider.

### Unblur on mouse hover

Under each slider, an optional checkbox:

- **Unblur on mouse hover**

When checked, hovering over that blurred element (preview, name, or avatar) temporarily removes the blur until you move the cursor away. Each category has its own hover setting.

### Other

- **Privacy status** — popup shows “Privacy on” when any blur option is active, or “All off” when everything is disabled  
- **Persistent settings** — toggles, slider values, and hover preferences are saved in `chrome.storage.local` and restored when you reopen the browser  
- **Open WhatsApp Web** — quick button in the popup to open `web.whatsapp.com`  
- **Virtualized list support** — the extension re-tags chats as you scroll, because WhatsApp only keeps visible rows in the DOM  

---

## What gets blurred (technical targets)

WhatsBlur targets stable WhatsApp Web `data-testid` attributes in the chat list (`#pane-side`):

| Privacy option | DOM target |
|----------------|------------|
| Messages | `[data-testid="cell-frame-secondary"]` |
| Contacts | `[data-testid="cell-frame-title"]`, `[data-testid="cell-frame-label"]` |
| Profiles | Leftmost `img[src]` in each chat row (tagged by the content script) |

Chat rows are detected as:

```text
#pane-side → [aria-label="Chat list"] → [role="row"][data-testid^="list-item-"]
```

This structure-based approach is more reliable than depending on WhatsApp’s obfuscated CSS class names (e.g. `_ak8k`), which change often.

---

## How it works

1. **Content script** (`content.js`) runs on `https://web.whatsapp.com/*`, loads settings from storage, and applies CSS classes on `<html>`:
   - `whatsblur-messages`, `whatsblur-contacts`, `whatsblur-profiles` — enable blur types  
   - `whatsblur-hover-messages`, `whatsblur-hover-contacts`, `whatsblur-hover-profiles` — enable hover reveal  

2. **Stylesheet** (`styles.css`) is injected when at least one blur option is on. It uses CSS `filter: blur()` with intensity from CSS variables (`--wb-msg-blur`, `--wb-contact-blur`, `--wb-profile-blur`).

3. **DOM tagger** (`dom-tagger.js`) watches the chat list for new rows (scroll / DOM updates) and sets `data-whatsblur` attributes on profile images so they can be blurred independently of names and previews.

4. **Popup** (`popup.html` + `popup.js`) reads and writes settings, then notifies open WhatsApp tabs so changes apply without a full page reload.

```text
Popup change → chrome.storage.local → content script → HTML classes + CSS → WhatsApp UI
```

---

## Installation

### Requirements

- Google Chrome (or Chromium-based browser) with Manifest V3 support (Chrome 88+ recommended)  
- [WhatsApp Web](https://web.whatsapp.com) account  

### Steps

1. **Clone or download** this repository:

   ```bash
   git clone https://github.com/ErAnmolgurjar/WhatsBlur.git
   cd WhatsBlur
   ```

2. Open **`chrome://extensions/`** in Chrome.

3. Enable **Developer mode** (top-right).

4. Click **Load unpacked** and select the `WhatsBlur` folder.

5. Pin the extension from the puzzle icon if needed.

6. Open [WhatsApp Web](https://web.whatsapp.com) and click the WhatsBlur icon to configure privacy.

---

## Usage

1. Open **WhatsApp Web** and wait for the chat list to load.

2. Click the **WhatsBlur** icon in the toolbar.

3. Turn on the blur types you want:
   - **Blur all messages** — hide preview text  
   - **Blur all contacts** — hide names / group labels  
   - **Hide profile pictures** — hide avatars  

4. Adjust **blur strength** (0–20 px) for each type.

5. Optionally enable **Unblur on mouse hover** under any slider to peek at content while the cursor is over it.

6. Settings save automatically. Scroll the chat list if some rows do not update immediately (virtualized rendering).

### Example setups

| Goal | Suggested settings |
|------|---------------------|
| Screen sharing | All three blur types ON, hover OFF |
| Quick peek while blurred | Blur ON + **Unblur on mouse hover** ON for what you need to read |
| Hide only message previews | **Blur all messages** ON only |
| Hide names only | **Blur all contacts** ON only |

---

## Project structure

```text
WhatsBlur/
├── manifest.json      # Extension manifest (MV3)
├── content.js         # Settings, stylesheet injection, class toggles
├── dom-tagger.js      # Tags chat rows / profile images in the DOM
├── styles.css         # Blur and hover-unblur rules
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic and storage sync
├── icons/             # Extension icons (16, 48, 128)
├── LICENSE
└── README.md
```

---

## Stored settings

All settings are saved locally under these keys:

| Key | Description |
|-----|-------------|
| `blur_all_messages` | Message preview blur on/off |
| `blur_all_contacts` | Contact name blur on/off |
| `hide_profile_pictures` | Profile picture blur on/off |
| `blur_intensity_messages` | Message blur strength (0–20) |
| `blur_intensity_contacts` | Contact blur strength (0–20) |
| `blur_intensity_profiles` | Profile blur strength (0–20) |
| `unblur_hover_messages` | Unblur message preview on hover |
| `unblur_hover_contacts` | Unblur contact names on hover |
| `unblur_hover_profiles` | Unblur profile photos on hover |

---

## Compatibility

| | |
|--|--|
| **Browser** | Chrome / Edge / Brave (Chromium, Manifest V3) |
| **Site** | `https://web.whatsapp.com` only |
| **OS** | Windows, macOS, Linux |

WhatsApp Web updates may change the DOM. The extension targets `data-testid` attributes where possible; a future WhatsApp redesign might require an extension update.

---

## Privacy and security

- **No data collection** — nothing is sent to external servers  
- **Local only** — settings stay in your browser (`chrome.storage.local`)  
- **Visual only** — the extension does not read message content or modify WhatsApp’s servers  
- **No extra network requests** — only the bundled `styles.css` is loaded into the WhatsApp tab  

---

## Limitations

- Only affects the **chat list sidebar**, not the open conversation panel (main chat messages are not blurred by default).  
- Only chats **currently in the DOM** are affected; scroll to load more rows in long lists.  
- Hover reveal requires the **Unblur on mouse hover** checkbox to be enabled for that category.  
- If WhatsApp changes `data-testid` names or list structure, blurring may stop working until the extension is updated.

---

## Troubleshooting

1. **Nothing blurs** — Reload the extension at `chrome://extensions/`, then hard-refresh WhatsApp Web (Cmd+Shift+R / Ctrl+Shift+R).  
2. **Only some chats blur** — Scroll the list; WhatsApp virtualizes rows.  
3. **Hover does not unblur** — Ensure the main blur toggle is ON and **Unblur on mouse hover** is checked for that category.  
4. **Check tagging** — On WhatsApp Web, open DevTools Console and run:

   ```javascript
   document.querySelectorAll('[data-whatsblur]').length
   ```

   A value greater than `0` means rows are being tagged.

---

## Contributing

Issues and pull requests are welcome. If WhatsApp Web changes break blurring, please include a sample of the chat list row HTML (from Inspect Element) when reporting bugs.

---

## License

See the [LICENSE](LICENSE) file for details.
