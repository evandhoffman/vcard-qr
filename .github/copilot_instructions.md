# GitHub Copilot Instructions

## Project Overview

This is a collection of **100% client-side JavaScript applications** for generating QR codes that embed full data for common tasks like contacts (vCards), calendar events, and more. All data processing happens in the browser - no server-side code, no external services, no tracking.

## Core Principles

1. **Privacy First**: All data stays in the browser. No API calls, no data collection, no analytics.
2. **Offline Capable**: Apps work without internet after initial page load (CDN dependencies can be downloaded locally).
3. **Self-Contained QR Codes**: Data is embedded directly in the QR code using standard formats (vCard 3.0, iCalendar, etc.), not links to third-party services.
4. **Mobile-Friendly**: Responsive design with mobile-first considerations.
5. **Security**: All user inputs are sanitized to prevent injection attacks while preserving legitimate special characters.

## Technology Stack

- **Pure HTML/CSS/JavaScript** - No frameworks, no build process
- **QR Code Library**: [davidshimjs/qrcodejs](https://davidshimjs.github.io/qrcodejs/) - Client-side QR code generation
- **Standard Formats**: vCard 3.0, iCalendar (RFC 5545), etc.

## Code Architecture

### File Structure

```plaintext
/
├── vcard.html           # vCard/contact QR code generator
├── calendar.html        # Calendar event QR code generator (if exists)
├── qrcode.min.js        # QR code library (local copy)
├── vcard-utils.js       # Shared utility functions
├── vcard-app.js         # vCard-specific event handlers
└── [format]-app.js      # Other format-specific handlers
```

### Shared Utilities (`vcard-utils.js`)

All apps share common utility functions:

- **`$(id)`**: DOM element selector shorthand
- **`debounceRender()`**: Debounce function for auto-regeneration (100ms delay)
- **`esc(str)`**: Escapes special characters for vCard/iCalendar formats (backslashes, semicolons, commas, newlines)
- **`sanitize*()`**: Input sanitization functions
  - `sanitizeName()`: For person names (allows hyphens, apostrophes, e.g., "Mary-Jo", "D'Angelo")
  - `sanitizeText()`: For general text fields
  - `sanitizeUrl()`: For URL validation
- **`md5(str)`**: MD5 hash for Gravatar URLs
- **`makeVCard()`**: Generate vCard 3.0 format string
- **`renderQR()`**: Generate QR code and update UI

## Coding Guidelines

### Input Sanitization

**ALWAYS** sanitize user inputs before processing:

```javascript
// Names: preserve hyphens, apostrophes, periods
const name = sanitizeName($("name").value);

// General text: allow common punctuation
const note = sanitizeText($("note").value);

// Phone numbers: keep + and digits only
const phone = val.replace(/[^\d+]/g, ' ').replace(/\s+/g, ' ').trim();

// URLs: remove whitespace and control chars
const url = sanitizeUrl($("url").value);
```

### vCard Format Requirements

When generating vCard data:

1. Use **vCard 3.0** format (most compatible)
2. Use **CRLF** (`\r\n`) for line breaks
3. **Escape** special characters: `\`, `;`, `,`, newlines
4. Required fields: `BEGIN:VCARD`, `VERSION:3.0`, `N:`, `FN:`, `END:VCARD`
5. Phone format: `TEL;TYPE=CELL,VOICE:+1 555 123 4567`
6. Photo URLs: `PHOTO;TYPE=JPEG;VALUE=URL:https://...`
7. Address format: `ADR;TYPE=WORK:;;street;city;region;postal;country`

### UI/UX Patterns

1. **Auto-regeneration**: Use debounced input listeners (100ms) for live updates
2. **Progressive Disclosure**: Hide advanced fields behind "Show more" toggle
3. **Field Order**: Most important fields first (name, email, phone)
4. **Download Filenames**: Use sanitized name field (e.g., `John_Smith.vcf`, `John_Smith_qrcode.png`)
5. **Payload Size Warning**: Warn if QR code data > 2500 bytes (suggest keeping under ~2900 bytes)

### Mobile Responsiveness

Use this breakpoint pattern:

```css
@media (max-width: 768px) {
  body { padding: 12px; }
  .wrap { grid-template-columns: 1fr; } /* Stack vertically */
  button { width: 100%; } /* Full-width buttons */
  .row { grid-template-columns: 1fr; } /* Single column for multi-field rows */
  input { font-size: 16px; } /* Prevent iOS zoom on focus */
}
```

### Event Handlers

Standard button handlers:

```javascript
// Generate QR
$("gen").addEventListener('click', (e) => { 
  e.preventDefault(); 
  renderQR(); 
});

// Download PNG
$("download").addEventListener('click', (e) => {
  // Get QR image, create sanitized filename, trigger download
});

// Download VCF/ICS
$("downloadFile").addEventListener('click', (e) => {
  // Create Blob with proper MIME type, trigger download
});

// Copy to clipboard
$("copy").addEventListener('click', async (e) => {
  // Use navigator.clipboard.writeText with fallback
});
```

## Common Patterns

### Creating a New Format Page

1. Copy HTML structure from `vcard.html`
2. Update form fields for the new format
3. Include shared scripts: `qrcode.min.js`, `vcard-utils.js`
4. Create new `[format]-app.js` with format-specific logic
5. Implement `make[Format]()` function following standard format specs
6. Add auto-regeneration for all input fields
7. Test on mobile devices

### Data Format Standards

- **vCard**: Use vCard 3.0 (RFC 2426)
- **Calendar**: Use iCalendar format (RFC 5545)
- **WiFi**: Use WIFI:T:WPA;S:SSID;P:password;; format
- Always validate against official specs

### Error Handling

```javascript
// QR library check
if (typeof QRCode === 'undefined') {
  console.error('QRCode library not loaded');
  $("preview").textContent = 'Error: QRCode library failed to load...';
  return;
}

// Clipboard fallback
try {
  await navigator.clipboard.writeText(data);
} catch(_) {
  // Use document.execCommand fallback
}
```

## Testing Checklist

When adding new features:

- [ ] Works on mobile (iOS Safari, Chrome Android)
- [ ] QR code scans correctly on multiple devices
- [ ] Inputs properly sanitized (test with special characters)
- [ ] Generated file downloads with correct filename
- [ ] Auto-regeneration works with 100ms debounce
- [ ] Works offline (after initial load)
- [ ] No console errors
- [ ] Payload size warning appears when needed
- [ ] Form validates edge cases (empty fields, long text, special chars)

## Color Scheme

Dark theme with blue accents:

- Background: `#0b0c10`
- Card: `#15171d`
- Borders: `#252832`, `#2a2f3a`
- Primary button: `#2d6cdf`
- Text: `#e8e8e8`
- Muted text: `#9aa3b2`
- Links/accents: `#3d7bf0`
- Success: `#a6f5a6`
- Warning: `#ffd27e`

## Dependencies

- **qrcode.min.js**: Local copy of davidshimjs/qrcodejs for offline use
- All other functionality is vanilla JavaScript - no external dependencies

## Attribution

Always credit QR library author: `davidshimjs/qrcodejs`
