# AdBlock & Privacy Shield (Chrome Extension Manifest V3)

A high-performance, production-ready, privacy-first Chrome Extension for network-level ad and tracker blocking built on **Manifest V3** and **DeclarativeNetRequest (DNR)**.

---

## 1. Project Purpose

AdBlock & Privacy Shield is designed to block intrusive advertisements, tracking pixels, behavioral analytics, fingerprinting scripts, and telemetry beacons directly at the browser network layer without injecting fragile DOM manipulation scripts or running resource-heavy background loops.

### Key Highlights
- **100% Manifest V3 Compliant**: Built strictly with modern Chromium APIs (`declarativeNetRequest`, `chrome.storage.local`, Service Worker).
- **Network-Level Blocking**: Advertisements and trackers are blocked natively by Chromium before network packets or scripts reach the page DOM.
- **Zero Telemetry & 100% Private**: Contains zero analytics, zero external network requests, zero remote code execution (`eval`/`new Function`), and stores all preferences locally on your device.
- **High-Performance Statistics**: Features in-memory counter aggregation and debounced storage syncing to eliminate `chrome.storage.local` write spam.
- **Accessible & Responsive UI**: Modern popup and options dashboard with support for system, dark, and light themes.

---

## 2. Features

- **Ad Blocking**: Intercepts and blocks banners, popups, popunders, ad networks, and video ad delivery endpoints.
- **Tracker & Telemetry Blocking**: Blocks web analytics (Google Analytics, Hotjar, Mixpanel, Amplitude), social conversion pixels (Meta/Facebook Pixel, TikTok, LinkedIn, Twitter/X, Pinterest), fingerprinting APIs, and telemetry beacons.
- **Site-Specific Whitelisting**: Allows trusted domains to bypass blocking with automatic subdomain inheritance (`example.com` automatically covers `sub.example.com`).
- **Temporary Site Pause (Session Rules)**: Temporarily disables protection for the current tab/session without permanently altering your whitelist.
- **Aggregated Statistics**: Real-time insights for total ads/trackers blocked, daily breakdown, and per-site historical counters with automatic pruning.
- **Filter List Management**: Overview of active DNR static rulesets with live rule counters.

---

## 3. Architecture Overview

```
                          ┌──────────────────────────────────────────────┐
                          │               Browser Network Layer          │
                          │        (Chrome DeclarativeNetRequest Engine)  │
                          └──────────────────────┬───────────────────────┘
                                                 │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   ▼                             ▼                             ▼
       ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
       │     Static Rules     │      │    Dynamic Rules     │      │    Session Rules     │
       │ (Compiled Manifest)  │      │ (Permanent Whitelist)│      │  (Temporary Pause)   │
       │ Priority: 100 - 300  │      │    Priority: 1000    │      │    Priority: 2000    │
       │ Action: block        │      │Action:allowAllRequest│      │Action:allowAllRequest│
       └──────────────────────┘      └──────────────────────┘      └──────────────────────┘
                   │                             │                             │
                   └─────────────────────────────┼─────────────────────────────┘
                                                 │
                                                 ▼
                          ┌──────────────────────────────────────────────┐
                          │         Background Service Worker            │
                          │   - Lifecycle & Message Dispatcher           │
                          │   - In-Memory Statistics Aggregation Engine  │
                          │   - Debounced Storage Sync (3-4s batch)      │
                          └──────────────────────┬───────────────────────┘
                                                 │
                                                 ▼
                          ┌──────────────────────────────────────────────┐
                          │            chrome.storage.local              │
                          │   - Settings & Whitelist State               │
                          │   - Schema Version & Migrations              │
                          │   - Bounded Daily/Site Statistics            │
                          └──────────────────────┬───────────────────────┘
                                                 │
                                 ┌───────────────┴───────────────┐
                                 ▼                               ▼
                     ┌──────────────────────┐        ┌──────────────────────┐
                     │       Popup UI       │        │  Options Dashboard   │
                     │  - Master ON/OFF     │        │  - Whitelist CRUD    │
                     │  - Site Quick Action │        │  - Filter Lists View │
                     │  - Real-Time Stats   │        │  - Historical Stats  │
                     └──────────────────────┘        └──────────────────────┘
```

---

## 4. Technologies Used

- **Runtime**: Chrome Extension Manifest V3 (MV3)
- **Language**: TypeScript 5.7 (Strict Mode enabled)
- **Core APIs**: `chrome.declarativeNetRequest`, `chrome.storage.local`, `chrome.runtime`, `chrome.tabs`
- **Build System**: `esbuild` (blazing fast, lightweight ESM bundler)
- **Styling**: Vanilla CSS with Design Tokens & CSS Custom Properties (zero UI framework bloat)
- **Testing**: Node.js Native Test Runner (`node:test`, `node:assert/strict`)

---

## 5. Declared Permissions & Transparency

| Permission | Scope | Justification |
| :--- | :--- | :--- |
| `declarativeNetRequest` | API | Enables native Chromium network filtering to block ads and tracking requests declaratively without running background scripts on each HTTP packet. |
| `storage` | API | Stores user configuration, whitelisted domains, and local aggregated blocking counters in `chrome.storage.local`. |
| `<all_urls>` | Host Permission | Required by DeclarativeNetRequest to match third-party ad networks and subresources requested across websites you visit. |

---

## 6. Project Structure

```
adblock/
├── src/
│   ├── background/
│   │   ├── service-worker.ts       # Service Worker lifecycle & event coordinator
│   │   ├── message-handler.ts      # Type-safe runtime message dispatcher
│   │   └── statistics-manager.ts   # In-memory aggregation & batched storage flusher
│   ├── blocking/
│   │   ├── ruleset-manager.ts      # Static ruleset toggle & status management
│   │   ├── dynamic-rules.ts        # Dynamic & session rule synchronizer
│   │   ├── whitelist-rules.ts      # Whitelist-to-DNR rule converter
│   │   └── rule-types.ts           # DNR type definitions and priorities
│   ├── storage/
│   │   ├── storage.ts              # Type-safe chrome.storage.local wrapper
│   │   ├── schema.ts               # Storage schema defaults & corruption repair
│   │   └── migrations.ts           # Schema versioning & migration engine
│   ├── popup/
│   │   ├── popup.html              # Popup UI markup (accessible, semantic)
│   │   ├── popup.ts                # Popup controller (strict CSP)
│   │   └── popup.css               # Design tokens, themes & animations
│   ├── options/
│   │   ├── options.html            # Settings & analytics dashboard markup
│   │   ├── options.ts              # Options page logic & DOM rendering
│   │   └── options.css             # Dashboard responsive styling
│   ├── utils/
│   │   ├── domain.ts               # RFC-compliant domain normalization & validation
│   │   ├── validation.ts           # Input sanitization & date helpers
│   │   ├── constants.ts            # Central system constants & rule limits
│   │   └── logger.ts               # Controlled logging utility
│   └── types/
│       ├── messages.ts             # Runtime message payload contracts
│       └── storage.ts              # Storage data contracts
│
├── rules/
│   ├── ads/
│   │   ├── base.json               # Core ad networks & banner rules
│   │   └── networks.json           # Ad delivery & video ad server rules
│   ├── trackers/
│   │   ├── analytics.json          # Web analytics endpoints
│   │   ├── tracking.json           # Social pixels & conversion tags
│   │   └── telemetry.json          # Fingerprinting & telemetry endpoints
│   └── sites/
│       └── site-specific.json      # Specialized media & site rules
│
├── public/
│   ├── manifest.json               # Manifest V3 configuration
│   └── icons/                      # Extension icons (16, 32, 48, 128)
│
├── scripts/
│   ├── build.js                    # Production bundler & asset compiler
│   ├── validate-rules.js           # DNR rule schema, regex & duplicate ID checker
│   ├── audit.js                    # Security, CSP & performance static analysis
│   ├── lint.js                     # Code hygiene & lint script
│   └── generate-icons.js           # Pure Node PNG icon generator
│
├── tests/
│   ├── domain.test.ts              # Domain normalization & subdomain unit tests
│   ├── storage.test.ts             # Storage schema & corruption recovery tests
│   ├── whitelist.test.ts           # Whitelist & session pause rule tests
│   ├── rules.test.ts               # Ruleset format & limit tests
│   └── statistics.test.ts          # Aggregation & bounds unit tests
│
├── package.json
├── tsconfig.json
├── tsconfig.test.json
└── dist/                           # Final production-ready unpacked extension
```

---

## 7. Installation & Development

### Prerequisites
- Node.js `v18+` (tested on Node.js `v25.2.1`)
- npm `v9+`

### Setup
```bash
# Clone or navigate to the directory
cd adblock

# Install development dependencies
npm install
```

### Development Mode (Watch)
```bash
# Builds to dist/ and watches for file changes
npm run dev
```

### Production Build
```bash
# Compiles rules, bundles TypeScript, and copies assets to dist/
npm run build
```

### Running Tests & Validations
```bash
# 1. Typecheck TypeScript in strict mode
npm run typecheck

# 2. Validate all DeclarativeNetRequest rule files
npm run validate-rules

# 3. Run unit test suite
npm run test:src

# 4. Run static security and performance audit
npm run audit

# 5. Run full verification pipeline
npm run verify
```

---

## 8. Chrome Installation Guide (Load Unpacked)

1. Open Google Chrome.
2. In the address bar, navigate to: `chrome://extensions`
3. Enable **Developer mode** toggle in the top-right corner.
4. Click **Load unpacked** in the top-left toolbar.
5. Select the `dist/` folder inside this repository:
   ```
   c:\Users\muhammet\Desktop\adblock\dist
   ```
6. The extension icon will appear in the Chrome toolbar. Pin it for quick access.

---

## 9. Rule System & Priority Hierarchy

The extension categorizes rules into three distinct layers to ensure predictability and zero rule conflicts:

1. **Session Pause Rules (Priority 2000)**:
   - Action: `allowAllRequests`
   - Scope: `initiatorDomains: [domain]`
   - Cleared on browser session restart or when the user clicks "Resume Site".
2. **Dynamic Whitelist Rules (Priority 1000)**:
   - Action: `allowAllRequests`
   - Scope: `initiatorDomains: [domain]`
   - Persisted across browser restarts in `chrome.storage.local`.
3. **Static Block Rulesets (Priority 100 - 300)**:
   - Action: `block`
   - Subdivided into `ruleset_ads` (Priority 100), `ruleset_trackers` (Priority 200), and `ruleset_sites` (Priority 300).
   - Toggled via `chrome.declarativeNetRequest.updateEnabledRulesets`.

---

## 10. Whitelist & Domain Normalization

When a domain is added to the whitelist:
- User inputs (e.g., `https://www.example.com/path?param=1`) are sanitized, stripped of protocols/paths, converted to lowercase ASCII, and validated against RFC 1035/1123 hostname rules.
- Whitelisting `example.com` automatically permits traffic on `example.com`, `www.example.com`, `sub.example.com`, and any nested subdomains.

---

## 11. Statistics & Storage Architecture

To maintain browser responsiveness and prevent disk I/O bottlenecks:
- Blocked events are buffered in memory inside `StatisticsManager`.
- Counters are synced to `chrome.storage.local` in debounced atomic batches (every 3 seconds or upon service worker suspension).
- Storage growth is strictly capped:
  - **Site Statistics**: Bounded to `MAX_SITE_STATISTICS: 500` domains using LRU pruning.
  - **Daily Statistics**: Historical records older than `STATISTICS_RETENTION_DAYS: 90` days are automatically purged.
  - **Corrupted Storage Recovery**: Storage schemas include automatic migration and fallback mechanisms to recover safely if local storage becomes corrupted.

---

## 12. Privacy Policy & Security Commitments

- **Zero Telemetry**: We do not collect, store, or transmit any browsing history, IP addresses, or personal data.
- **Zero Remote Code**: All filtering logic and rules are bundled inside the extension package.
- **Strict Content Security Policy (CSP)**: Zero inline JavaScript, zero `onclick` attributes, and zero dynamic code evaluation (`eval`/`new Function`).

---

## 13. Known Technical Limitations

1. **Chromium DNR Static Rule Limits**: Manifest V3 imposes limits on static rules (guaranteed 30,000 rules per extension). Our compiled rulesets use ~0.25% of this quota, leaving ample headroom.
2. **In-Stream Video Ads on Unified Endpoints**: Video platforms that serve media content and advertisements from identical video stream URLs without distinct ad subdomains cannot be filtered via network URL matching without breaking video playback.
3. **Restricted Browser Pages**: Chrome security policies prohibit extensions from intercepting or injecting scripts into `chrome://`, `chrome-extension://`, `devtools://`, and Chrome Web Store pages.

---

## 14. License

MIT License. Free to use, modify, and distribute for personal and commercial projects.
