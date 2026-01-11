# ⏰ Shame Clock

> **Your personal accountability companion for mindful browsing.**

A privacy-first browser extension that tracks time spent on distracting websites and delivers personalized motivational messages using local AI. Stay focused with customizable goals, focus sessions, and intelligent intervention systems—all while keeping your data 100% private.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/Chrome-supported-brightgreen.svg)
![Firefox](https://img.shields.io/badge/Firefox-supported-orange.svg)
![Edge](https://img.shields.io/badge/Edge-supported-blue.svg)

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage Guide](#-usage-guide)
- [Configuration](#-configuration)
- [Development](#-development)
- [Testing](#-testing)
- [Privacy & Security](#-privacy--security)
- [Browser Compatibility](#-browser-compatibility)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🕐 Intelligent Time Tracking

| Feature | Description |
|---------|-------------|
| **Automatic Tracking** | Silently monitors time on configured distracting websites |
| **Real-Time Updates** | Live session timer in popup with second-by-second updates |
| **Daily Statistics** | Detailed breakdown by site with rankings and progress bars |
| **Weekly Analytics** | Visual 7-day chart with trends and averages |
| **Page-Level Rules** | Whitelist specific pages (e.g., educational YouTube) |
| **Pause/Resume** | One-click tracking pause with scheduled resume |

### 🎯 Goal Setting & Progress

- **Daily Limits** — Set total distraction time limits per day
- **Site-Specific Limits** — Individual limits for specific sites
- **Weekly Goals** — Track progress over the week
- **Progress Visualization** — Color-coded bars with warnings at 80%/100%
- **Goal Notifications** — Alerts when approaching or exceeding limits
- **Streak Tracking** — Build consistency with daily streaks

### 🍅 Focus Sessions (Pomodoro)

```
┌─────────────────────────────────────┐
│  🎯 Focus Session                   │
│  ████████████░░░░░░░░  18:24        │
│                                     │
│  [Pause]  [Stop]                    │
└─────────────────────────────────────┘
```

- **Customizable Durations** — 25, 45, 60 minutes or custom
- **Short & Long Breaks** — Automatic break suggestions
- **Session History** — Track completed focus sessions
- **Today's Stats** — Focus time, sessions completed, streak

### 🤖 AI-Powered Messages

- **Local AI Generation** — Runs entirely on your device using Transformers.js
- **Three Unique Personas**:
  - 👤 **Your Future Self** — Disappointed but motivational
  - 👩 **Your Mom** — Concerned and caring
  - 📚 **Historical Figures** — Wise and inspirational
- **Context-Aware** — Messages tailored to time spent and site
- **Template Fallback** — Works even without AI
- **Message Caching** — Prevents repetitive messages

### ⏰ Smart Scheduling

| Mode | Description |
|------|-------------|
| **Quiet Hours** | No popups during sleep (e.g., 10 PM - 8 AM) |
| **Work Hours** | Stricter thresholds during work (e.g., 9 AM - 5 PM) |
| **Weekend Mode** | More lenient tracking on weekends |
| **Custom Schedules** | Create your own tracking schedules |

### 🔔 Intelligent Notifications

- **Rich Browser Notifications** — With action buttons
- **Sound Alerts** — Optional with volume control
- **Do Not Disturb** — Respect your focus time
- **Notification History** — Review past alerts
- **Goal Warnings** — Alerts at configurable thresholds

### 📊 Comprehensive Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  📊 Today's Overview                                    │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  2h 15m  │ │    8     │ │   17m    │ │  reddit  │   │
│  │  Total   │ │  Sites   │ │ Avg/Site │ │ Top Site │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│  📈 Site Activity Breakdown                             │
│  1. reddit.com     ████████████████░░░░  45m           │
│  2. youtube.com    ██████████░░░░░░░░░░  32m           │
│  3. twitter.com    ██████░░░░░░░░░░░░░░  18m           │
│                                                         │
│  📅 Weekly Summary                                      │
│  Mon Tue Wed Thu Fri Sat Sun                           │
│   █   █   ██  █   ██  ░   ░                            │
└─────────────────────────────────────────────────────────┘
```

### 🔒 Privacy-First Design

| Principle | Implementation |
|-----------|----------------|
| **100% Local** | All data stays on your device |
| **No Servers** | Zero external data transmission |
| **No Analytics** | No tracking or telemetry |
| **Full Control** | Export, import, or delete anytime |
| **GDPR/CCPA** | Compliant by design |

### 🎨 Modern User Interface

- **Clean Popup** — Live tracking with at-a-glance stats
- **Professional Dashboard** — Sidebar navigation with tabs
- **Dark Mode Support** — Automatic system detection
- **Responsive Design** — Works on all screen sizes
- **Smooth Animations** — Polished transitions
- **Accessibility** — ARIA labels, keyboard navigation

### ⚡ Performance Optimized

- **Efficient Caching** — Minimizes storage reads
- **Batched Writes** — Reduces storage operations
- **Lazy Loading** — Loads features on demand
- **Debounced Updates** — Prevents excessive refreshes

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/shame-clock.git
cd shame-clock

# 2. Install dependencies
npm install

# 3. Build the extension
npm run build

# 4. Load in browser (see Installation section)
```

---

## 📦 Installation

### Prerequisites

- **Node.js** v16 or higher
- **npm** or **yarn**
- Modern browser (Chrome 88+, Firefox 89+, Edge 88+)

### Step-by-Step Installation

#### 1. Clone & Install

   ```bash
git clone https://github.com/yourusername/shame-clock.git
cd shame-clock
   npm install
   ```

#### 2. Build

   ```bash
# Production build
   npm run build

# Development build with auto-reload
npm run dev
```

#### 3. Load in Browser

<details>
<summary><b>🟢 Chrome / Edge</b></summary>

1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `dist/` folder
5. Pin the extension for easy access

</details>

<details>
<summary><b>🟠 Firefox</b></summary>

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `dist/manifest.json`

> **Note:** Firefox requires reloading on each browser restart for temporary add-ons.

</details>

#### 4. Initial Setup

1. Click the Shame Clock icon in your toolbar
2. Complete the welcome tutorial (or skip)
3. Review monitored sites in Settings
4. Choose your preferred personas
5. Set your first goal!

---

## 📖 Usage Guide

### Basic Workflow

```
Visit Tracked Site → Time Starts → Reach Threshold → See Reminder → Refocus!
```

### Popup Overview

| Element | Description |
|---------|-------------|
| **⏸️ Pause Button** | Temporarily stop tracking |
| **⚙️ Settings Button** | Open dashboard |
| **Stats Cards** | Total time & active sites |
| **Live Session** | Current site timer |
| **Goal Progress** | Daily goal completion |
| **Activity List** | Today's site breakdown |

### Dashboard Tabs

| Tab | Purpose |
|-----|---------|
| **Dashboard** | Overview, charts, weekly summary |
| **Goals** | Set and track time limits |
| **Monitored Sites** | Manage tracked websites |
| **AI Personas** | Choose your motivational voices |
| **Behavior** | Configure popup settings |
| **Schedule** | Set quiet hours, work mode |
| **Focus Sessions** | Pomodoro timer |
| **Privacy & Data** | Export, import, clear data |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` | Pause/Resume tracking |
| `Ctrl+Shift+S` | Open settings |
| `Ctrl+Shift+F` | Start focus session |
| `Ctrl+N` | Snooze current popup |
| `Escape` | Dismiss popup |

---

## ⚙️ Configuration

### Default Monitored Sites

The extension comes preconfigured with common distracting sites:

| Category | Sites |
|----------|-------|
| **Social Media** | Facebook, Twitter/X, Instagram, TikTok |
| **Entertainment** | YouTube, Netflix, Twitch, Reddit |
| **Gaming** | Discord, Twitch |
| **Other** | 9GAG, BuzzFeed |

### Adding Custom Sites

1. Go to **Settings → Monitored Sites**
2. Enter domain in the input field (e.g., `news.ycombinator.com`)
3. Click **Add domain**

### Page-Level Rules

Whitelist specific pages within tracked sites:

```
Example: Track youtube.com but NOT educational channels

Rule: Whitelist URLs containing "/channel/UCeducational"
```

### Popup Behavior Settings

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| **Patience Threshold** | 5 min | 1-60 min | Time before first popup |
| **Popup Duration** | 30 sec | 5-120 sec | How long popup shows |
| **Cooldown Period** | 3 min | 1-60 min | Time between popups |
| **Snooze Duration** | 5 min | 1-30 min | Snooze dismissal time |

### Schedule Settings

```javascript
// Example: Quiet hours configuration
{
  quietHoursEnabled: true,
  quietHoursStart: "22:00",  // 10 PM
  quietHoursEnd: "08:00",    // 8 AM
  workHoursEnabled: true,
  workHoursStart: "09:00",   // 9 AM
  workHoursEnd: "17:00",     // 5 PM
  weekendMode: true          // More lenient on weekends
}
```

---

## 🛠️ Development

### Project Structure

```
shame-clock/
├── 📄 manifest.json           # Extension manifest (MV3)
├── 📄 package.json            # Dependencies & scripts
├── 📄 webpack.config.js       # Build configuration
├── 📄 vitest.config.js        # Test configuration
│
├── 📁 src/                    # Source code
│   ├── 📁 background/         # Service worker
│   │   ├── service-worker.js  # Main background script
│   │   └── time-tracker.js    # Core tracking logic
│   │
│   ├── 📁 content/            # Content scripts
│   │   ├── content-script.js  # Page injection
│   │   ├── popup-overlay.js   # Intervention overlay
│   │   └── popup-overlay.css  # Overlay styles
│   │
│   ├── 📁 popup/              # Extension popup
│   │   ├── popup.html         # Popup structure
│   │   ├── popup.js           # Popup logic
│   │   └── popup.css          # Popup styles
│   │
│   ├── 📁 options/            # Settings page
│   │   ├── options.html       # Dashboard structure
│   │   ├── options.js         # Dashboard logic
│   │   └── options.css        # Dashboard styles
│   │
│   ├── 📁 ai/                 # AI functionality
│   │   ├── message-generator.js
│   │   ├── model-loader.js
│   │   └── personas.js
│   │
│   ├── 📁 utils/              # Utilities
│   │   ├── storage.js         # Storage abstraction
│   │   ├── config.js          # Default configuration
│   │   ├── site-matcher.js    # URL matching
│   │   ├── notifications.js   # Browser notifications
│   │   ├── goals.js           # Goal tracking
│   │   ├── scheduler.js       # Schedule management
│   │   ├── analytics.js       # Analytics calculations
│   │   ├── backup.js          # Backup/restore
│   │   ├── focus-sessions.js  # Pomodoro timer
│   │   ├── shortcuts.js       # Keyboard shortcuts
│   │   ├── page-rules.js      # Page whitelist/blacklist
│   │   ├── onboarding.js      # First-run experience
│   │   ├── error-handler.js   # Error management
│   │   ├── performance.js     # Performance utilities
│   │   └── i18n.js            # Internationalization
│   │
│   └── 📁 assets/             # Static assets
│       └── 📁 icons/          # Extension icons
│
├── 📁 data/                   # Data files
│   ├── default-sites.json     # Predefined sites
│   └── persona-prompts.json   # AI prompts
│
├── 📁 tests/                  # Test suites
│   ├── 📁 unit/               # Unit tests
│   ├── 📁 integration/        # Integration tests
│   ├── 📁 e2e/                # End-to-end tests
│   └── setup.js               # Test setup
│
└── 📁 dist/                   # Built extension (generated)
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Production build |
| `npm run dev` | Development build with watch |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run lint` | Run ESLint |
| `npm run test:build` | Build and verify |

### Development Workflow

```bash
# 1. Start development mode
npm run dev

# 2. Make changes to src/ files

# 3. Reload extension in browser
#    Chrome: Extensions page → Click reload icon
#    Firefox: about:debugging → Click "Reload"

# 4. Test changes

# 5. Run tests before committing
npm run test
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode (re-runs on changes)
npm run test:watch

# Visual test UI
npm run test:ui
```

### Test Structure

```javascript
// Example: storage.test.js
describe('Storage Utilities', () => {
  it('should return null for non-existent keys', async () => {
    const result = await getStorageValue('nonExistent');
    expect(result).toBeNull();
  });
});
```

### Manual Testing Checklist

- [ ] Extension loads without errors
- [ ] Tracking starts on monitored sites
- [ ] Popup shows live timer
- [ ] Intervention popups appear after threshold
- [ ] Goals track progress correctly
- [ ] Schedule settings work as expected
- [ ] Focus sessions complete properly
- [ ] Data exports/imports successfully
- [ ] Settings persist across sessions

---

## 🔐 Privacy & Security

### Data Collection

Shame Clock collects **locally on your device only**:

| Data | Purpose |
|------|---------|
| Domain names | Track which monitored sites you visit |
| Time spent | Calculate usage statistics |
| Settings | Remember your preferences |
| Goals | Track your progress |

### What We DON'T Collect

- ❌ Page contents or URLs
- ❌ Personal information
- ❌ Browsing history
- ❌ Any data sent to external servers

### Data Storage

| Aspect | Implementation |
|--------|----------------|
| **Location** | Browser's local storage |
| **Retention** | Configurable (30/60/90 days or unlimited) |
| **Encryption** | Browser-native storage encryption |
| **Access** | Only this extension |

### Permissions Explained

| Permission | Why Needed |
|------------|------------|
| `tabs` | Detect current website |
| `storage` | Save settings & data locally |
| `notifications` | Show browser notifications |
| `activeTab` | Access current tab URL |
| `host_permissions` | Inject content scripts |

### Data Control

```
Export → Download JSON backup
Import → Restore from backup
Clear  → Delete all data permanently
```

📄 See [privacy.md](./privacy.md) for complete privacy policy.

---

## 🌐 Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 88+ | ✅ Full Support | Manifest V3 |
| Edge 88+ | ✅ Full Support | Chromium-based |
| Firefox 89+ | ✅ Full Support | WebExtensions API |
| Safari | ⏳ Planned | Future release |
| Opera | ✅ Should Work | Chromium-based |
| Brave | ✅ Should Work | Chromium-based |

---

## 🔧 Troubleshooting

<details>
<summary><b>Extension not loading</b></summary>

1. Check browser console for errors (`F12` → Console)
2. Verify `dist/` folder exists (run `npm run build`)
3. Ensure icons exist in `dist/assets/icons/`
4. Validate `manifest.json` syntax

</details>

<details>
<summary><b>Time not tracking</b></summary>

1. Verify site is in monitored list (Settings → Sites)
2. Check if tracking is paused (look for pause icon)
3. Ensure extension is enabled
4. Reload extension and refresh page

</details>

<details>
<summary><b>AI messages not generating</b></summary>

1. First load downloads ~115MB model (may take 1-3 minutes)
2. Check browser console for download progress
3. Ensure "AI Synthesis" is enabled in Settings
4. Template fallback works if AI unavailable

</details>

<details>
<summary><b>Popups not appearing</b></summary>

1. Check if quiet hours are active
2. Verify popup is enabled in Settings
3. Wait for patience threshold (default: 5 minutes)
4. Check if popups are snoozed

</details>

<details>
<summary><b>Build errors</b></summary>

```bash
# Clear and reinstall
rm -rf node_modules dist
npm install
npm run build
```

</details>

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Getting Started

1. **Fork** the repository
2. **Clone** your fork
3. **Create** a feature branch
4. **Make** your changes
5. **Test** thoroughly
6. **Submit** a pull request

### Contribution Guidelines

- Follow existing code style
- Write tests for new features
- Update documentation as needed
- Keep commits atomic and well-described
- Reference issues in PR descriptions

### Areas for Contribution

- 🌍 Translations (i18n)
- 🎨 UI/UX improvements
- 🐛 Bug fixes
- 📝 Documentation
- ✨ New features
- ⚡ Performance optimizations

---

## 📝 License

MIT License — See [LICENSE](./LICENSE) for details.

```
MIT License

Copyright (c) 2024 Shame Clock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 🙏 Acknowledgments

- **[Transformers.js](https://github.com/xenova/transformers.js)** — Local AI inference
- **[Webpack](https://webpack.js.org/)** — Module bundling
- **[Vitest](https://vitest.dev/)** — Unit testing framework

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/shame-clock/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/shame-clock/discussions)

---

<div align="center">

**Stay focused, stay human.** ⏰

Made with ❤️ for productivity

[Report Bug](https://github.com/yourusername/shame-clock/issues) · [Request Feature](https://github.com/yourusername/shame-clock/issues)

</div>
