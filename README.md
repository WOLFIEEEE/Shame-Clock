# Shame Clock

A privacy-first browser extension that tracks time spent on distracting websites and displays AI-generated motivational messages from various personas (your disappointed future self, mom, or historical figures) to encourage more productive browsing habits.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/Chrome-supported-brightgreen.svg)
![Firefox](https://img.shields.io/badge/Firefox-supported-orange.svg)
![Edge](https://img.shields.io/badge/Edge-supported-blue.svg)

## ✨ Features

### 🕐 Time Tracking
- **Automatic tracking** of time spent on configured distracting websites
- **Real-time updates** showing current session time
- **Daily statistics** with detailed breakdowns
- **Weekly analytics** with visual charts
- **Smart detection** of monitored sites with domain matching

### 🤖 AI-Powered Messages
- **Local AI generation** using Transformers.js (runs entirely on your device)
- **Multiple personas** to choose from:
  - **Future Self**: Disappointed, motivational messages from your future self
  - **Mom**: Concerned, caring reminders
  - **Historical Figures**: Wise, inspirational quotes
- **Template fallback** system if AI is unavailable
- **Message caching** to avoid repetition
- **Context-aware** generation based on time spent

### 🎯 Smart Intervention System
- **Adaptive popup frequency** based on time spent:
  - 0-5 minutes: No intervention
  - 5-15 minutes: Reminder every 10 minutes
  - 15-30 minutes: Reminder every 5 minutes
  - 30+ minutes: Reminder every 3 minutes
- **Non-intrusive overlays** with smooth animations
- **Browser notifications** as fallback
- **Configurable thresholds** and cooldown periods

### 📊 Comprehensive Dashboard
- **Today's Overview**: Total time, sites visited, averages, and top site
- **Site Activity Breakdown**: Ranked list with progress bars
- **Weekly Summary**: 7-day visualization with trends
- **Real-time updates** with auto-refresh
- **Export/Import** functionality for data portability

### 🔒 Privacy-First Design
- **100% local processing** - all data stays on your device
- **No external servers** - no data transmission
- **No tracking** - no analytics or telemetry
- **GDPR & CCPA compliant** by design
- **Full data control** - export, import, or delete anytime

### 🎨 Modern User Interface
- **Clean popup** with live session tracking
- **Professional settings page** with sidebar navigation
- **Responsive design** that works on all screen sizes
- **Smooth animations** and transitions
- **Intuitive controls** for easy configuration

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Chrome, Firefox, or Edge browser

### Installation

1. **Clone or download** this repository

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create icons** (required before building):
   - Add icon files to `src/assets/icons/`:
     - `icon16.png` (16×16 pixels)
     - `icon48.png` (48×48 pixels)
     - `icon128.png` (128×128 pixels)
   - Or use `create-test-icons.html` in a browser to generate placeholder icons

4. **Build the extension**:
   ```bash
   npm run build
   ```

5. **Load in your browser**:
   
   **Chrome/Edge:**
   - Navigate to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `dist/` folder
   
   **Firefox:**
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select `dist/manifest.json`

6. **Configure your sites**:
   - Click the extension icon → Settings
   - Enable/disable default sites or add custom domains
   - Choose your preferred personas
   - Adjust popup settings to your preference

## 📖 Usage

### Basic Usage

1. **Visit a tracked site** (e.g., reddit.com, youtube.com)
2. **Time tracking starts automatically** - you'll see a live indicator in the popup
3. **After the threshold** (default: 5 minutes), intervention messages will appear
4. **Check your stats** by clicking the extension icon

### Dashboard

Access the comprehensive dashboard:
- Click extension icon → Settings → Dashboard tab
- View today's statistics, site breakdowns, and weekly trends
- Use the refresh button to update data manually
- Dashboard auto-refreshes every 30 seconds when active

### Customization

**Add Custom Sites:**
- Settings → Monitored Sites → Add domain (e.g., `news.ycombinator.com`)

**Configure Personas:**
- Settings → AI Personas → Enable/disable personas
- At least one persona must be enabled

**Adjust Popup Behavior:**
- Settings → Behavior → Configure:
  - Patience Threshold (minutes before first popup)
  - Attention Span (how long popup stays visible)
  - Cooldown Period (minutes between popups)
  - Enable/disable AI synthesis

**Privacy Controls:**
- Settings → Privacy & Data → Export, import, or clear data

## 🛠️ Development

### Project Structure

```
shame-clock-extension/
├── manifest.json              # Extension manifest (Manifest V3)
├── package.json              # Dependencies and scripts
├── webpack.config.js         # Build configuration
├── README.md                 # This file
├── privacy.md                # Privacy policy
├── LICENSE                   # MIT License
│
├── src/                      # Source code
│   ├── background/
│   │   ├── service-worker.js # Background service worker
│   │   └── time-tracker.js   # Core time tracking logic
│   ├── content/
│   │   ├── content-script.js # Content script injection
│   │   ├── popup-overlay.js  # Overlay popup logic
│   │   └── popup-overlay.css # Overlay styles
│   ├── popup/
│   │   ├── popup.html        # Extension popup UI
│   │   ├── popup.js          # Popup logic
│   │   └── popup.css         # Popup styles
│   ├── options/
│   │   ├── options.html      # Settings page
│   │   ├── options.js        # Settings logic
│   │   └── options.css       # Settings styles
│   ├── ai/
│   │   ├── message-generator.js # AI message generation
│   │   ├── model-loader.js     # AI model loading
│   │   └── personas.js         # Persona definitions
│   ├── utils/
│   │   ├── storage.js        # Storage abstraction
│   │   ├── notifications.js  # Browser notifications
│   │   ├── site-matcher.js  # URL pattern matching
│   │   └── config.js         # Default configuration
│   └── assets/
│       └── icons/           # Extension icons
│
├── data/                     # Data files
│   ├── default-sites.json   # Predefined distracting sites
│   └── persona-prompts.json # AI persona prompts
│
└── dist/                     # Built extension (generated)
    └── [compiled files]
```

### Build Commands

```bash
# Production build
npm run build

# Development build with watch mode
npm run dev

# Build and verify
npm run test:build
```

### Development Workflow

1. Make changes to files in `src/`
2. Run `npm run dev` for watch mode (auto-rebuilds on changes)
3. Reload extension in browser (Extensions page → Reload icon)
4. Test changes

### Testing

**Manual Testing:**
1. Load extension in browser
2. Visit a tracked site (e.g., reddit.com)
3. Wait for tracking to start (check popup)
4. Verify popups appear after threshold
5. Test settings page functionality
6. Verify dashboard displays data correctly

**Automated Testing:**
```javascript
// Run in browser console (after loading extension)
// Copy contents of test-extension.js and execute
testExtension()
```

## 🔧 Configuration

### Default Sites

The extension comes with a curated list of commonly distracting sites:
- Social media platforms
- Video streaming sites
- News aggregators
- Gaming sites
- And more...

You can enable/disable any default site or add your own custom domains.

### Personas

Three built-in personas with unique voices:

1. **Future Self**: Disappointed but motivational messages
2. **Mom**: Concerned and caring reminders
3. **Historical Figures**: Wise and inspirational quotes

You can enable multiple personas - messages will rotate between them.

### Popup Settings

- **Patience Threshold**: Minutes to wait before first popup (default: 5 min)
- **Attention Span**: How long popup stays visible in seconds (default: 30 sec)
- **Cooldown Period**: Minutes between consecutive popups (default: 3 min)
- **AI Synthesis**: Enable/disable AI-generated messages (default: enabled)

## 🔐 Privacy & Security

### Data Collection

Shame Clock collects the following **locally on your device**:
- Domain names of visited tracked sites
- Time spent on each domain (in milliseconds)
- Extension settings and preferences

### Data Storage

- All data stored in browser's local storage
- Data automatically cleaned after 30 days
- No data transmitted to external servers
- No third-party analytics or tracking

### Permissions

The extension requests minimal permissions:
- `tabs` - To detect which websites you're visiting
- `storage` - To save settings and time data locally
- `notifications` - To show browser notifications
- `activeTab` - To access current tab's URL
- `host_permissions` - To inject content scripts on tracked sites

See [privacy.md](./privacy.md) for complete privacy policy.

## 🌐 Browser Compatibility

- ✅ **Chrome** (Manifest V3)
- ✅ **Edge** (Manifest V3)
- ✅ **Firefox** (WebExtensions API, Manifest V3)

The extension uses a cross-browser API abstraction layer for compatibility.

## 📝 License

MIT License - See [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🐛 Troubleshooting

### Extension Not Loading

- Check browser console for errors (F12 → Console)
- Verify all files are in `dist/` folder
- Ensure icons exist in `dist/assets/icons/`
- Check manifest.json is valid

### Time Not Tracking

- Verify site is in monitored sites list
- Check browser console for errors
- Ensure extension is enabled
- Reload the extension

### AI Messages Not Generating

- First load may take 1-5 minutes (model download ~500MB)
- Check browser console for errors
- Verify AI is enabled in settings
- Template fallback will work if AI unavailable

### Build Errors

- Ensure Node.js v16+ is installed
- Run `npm install` to install dependencies
- Clear `node_modules` and reinstall if needed
- Check webpack configuration

## 📚 Additional Resources

- [Privacy Policy](./privacy.md) - Complete privacy information
- [LICENSE](./LICENSE) - MIT License details

## 🙏 Acknowledgments

- Built with [Transformers.js](https://github.com/xenova/transformers.js) for local AI
- Uses [Webpack](https://webpack.js.org/) for bundling
- Icons and UI inspired by modern design principles

---

**Stay focused, stay human.** ⏰
