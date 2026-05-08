# WhatsBlur

A Chrome extension that enhances privacy on WhatsApp Web by injecting custom CSS to blur message previews in the sidebar. This prevents accidental exposure of message content while maintaining usability through hover interactions.

## Features

- **Message Preview Blurring**: Automatically blurs message previews in the chat list for enhanced privacy
- **Hover to Reveal**: Hover over blurred messages to temporarily reveal their content
- **Toggle Control**: Easy on/off toggle via the extension popup
- **System Message Styling**: Improved styling for system messages
- **Persistent Settings**: Remembers your preference across browser sessions

## Installation Guide

To install and use this extension locally on your Chrome browser, follow these steps:

### Step 1: Download or Clone the Repository
If you haven't already, download the extension files to your local machine. You can clone the repository or download the ZIP file.

```bash
git clone https://github.com/ErAnmolgurjar/WhatsBlur.git
cd WhatsBlur
```

### Step 2: Open Chrome Extensions Page
1. Open Google Chrome on your computer.
2. In the address bar, type `chrome://extensions/` and press Enter.
3. Alternatively, click the three-dot menu (⋮) in the top-right corner of Chrome, go to **More tools** > **Extensions**.

### Step 3: Enable Developer Mode
1. On the Extensions page, toggle the **Developer mode** switch in the top-right corner to enable it.

### Step 4: Load the Extension
1. Click the **Load unpacked** button that appears after enabling Developer mode.
2. In the file dialog that opens, navigate to the folder containing the extension files (the `WhatsBlur` folder you downloaded/cloned).
3. Select the `WhatsBlur` folder and click **Select Folder** (or **Open** on macOS).

### Step 5: Verify Installation
1. The extension should now appear in your list of installed extensions.
2. You should see the WhatsBlur icon in your Chrome toolbar (it might be hidden under the extensions menu if you have many extensions).

### Step 6: Use the Extension
1. Open [WhatsApp Web](https://web.whatsapp.com) in a new tab.
2. Click the WhatsBlur extension icon in the toolbar to open the popup.
3. Use the toggle to enable or disable the privacy features.
4. The extension will automatically apply the blurring effect to message previews in the sidebar.

## How It Works

- The extension injects custom CSS into WhatsApp Web pages
- Message previews are blurred and desaturated by default
- Hovering over a message temporarily removes the blur for reading
- Settings are stored locally and persist across browser restarts
- The popup provides an easy way to toggle the feature on/off

## Compatibility

- **Chrome Version**: Manifest V3 compatible (Chrome 88+ recommended)
- **WhatsApp Web**: Tested with current versions; may need updates for major WhatsApp changes
- **Platform**: Works on Windows, macOS, and Linux

## Privacy & Security

- No data is collected or transmitted
- All processing happens locally in your browser
- Only affects WhatsApp Web interface styling
- No external dependencies or network requests

## Contributing

Feel free to submit issues or pull requests if you find bugs or want to suggest improvements.

## License

See [LICENSE](LICENSE) file for details.
