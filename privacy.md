# Privacy Policy

**Last Updated:** January 2026

## TL;DR

**Shame Clock stores all data locally on your device. We don't collect, transmit, or share any of your data with external servers. Everything stays on your computer.**

## Introduction

Shame Clock is a privacy-first browser extension designed to help you manage your browsing habits. This privacy policy explains what data we collect, how we use it, and your rights regarding that data.

## Data Collection

Shame Clock collects the following information **locally on your device only**:

### Collected Data

- **Domain names** of websites you visit that match your tracked sites list
- **Time spent** on each tracked domain (in milliseconds)
- **Extension settings** including:
  - Your site preferences (enabled/disabled sites)
  - Custom sites you've added
  - Persona selections
  - Popup configurations (thresholds, durations, etc.)

### What We Don't Collect

- Full URLs or page paths
- Page content or text
- Personal information
- Browsing history (beyond domain names)
- Search queries
- Form data
- Passwords or credentials
- Any data from non-tracked sites

## Data Storage

### Local Storage

All data collected by Shame Clock is stored **locally on your device** using the browser's local storage API (`chrome.storage.local` or `browser.storage.local`). This includes:

- Time tracking data (daily totals per domain)
- Your custom site list
- Extension configuration settings
- Persona preferences
- Popup settings

### Data Retention

- Time tracking data is automatically cleaned up after **30 days** to prevent excessive storage usage
- Settings and preferences are retained until you delete them
- You can manually clear all data at any time from the settings page

### Data Location

All data remains on your device and is never transmitted to external servers. The extension operates entirely offline except for:

- Loading the local AI model (if enabled) - this happens locally or from a CDN, but **no user data is sent**
- Loading default site lists and persona prompts from the extension's bundled files

## Data Transmission

### No External Servers

**Shame Clock does not transmit any data to external servers.** All processing, including AI message generation, happens locally on your device using local AI models.

### Network Requests

The extension makes minimal network requests only for:

1. **AI Model Loading** (if enabled):
   - Downloads AI model files from CDN on first use
   - No user data is included in these requests
   - Models are cached locally after download

2. **Extension Resources**:
   - Loading bundled data files (default sites, persona prompts)
   - These are part of the extension package

### Third-Party Services

Shame Clock does **not** use any third-party services for:
- Analytics
- Tracking
- Data collection
- User behavior analysis
- Advertising
- Crash reporting

## Permissions

Shame Clock requests the following browser permissions:

### Required Permissions

- **`tabs`** - To detect which websites you're visiting
- **`storage`** - To save your settings and time tracking data locally
- **`notifications`** - To show browser notifications when appropriate
- **`activeTab`** - To access the current tab's URL for tracking
- **`host_permissions`** - To inject content scripts on tracked websites

### Permission Usage

These permissions are necessary for the extension's core functionality and are used **only** for the purposes described above. The extension does not:

- Access tabs you're not actively viewing
- Read page content beyond domain names
- Modify web pages beyond showing intervention popups
- Access browsing history
- Track activity on non-monitored sites

## Your Rights

You have **full control** over your data:

### View Your Data

- View all tracked data in the extension popup
- Access detailed statistics in the dashboard (Settings → Dashboard)
- See weekly trends and activity breakdowns

### Export Your Data

- Export all your data at any time from Settings → Privacy & Data → Export JSON
- Exported data includes:
  - Time tracking data
  - Configuration settings
  - Custom sites list
  - Export timestamp

### Delete Your Data

- Clear all data at any time from Settings → Privacy & Data → Wipe All Data
- Reset to factory defaults from Settings → Privacy & Data → Reset to Factory Defaults
- Disable tracking for specific sites or disable the extension entirely

### Control Tracking

- Enable/disable tracking for any site
- Add or remove custom sites
- Disable the extension entirely
- Configure popup behavior

## Children's Privacy

Shame Clock does not knowingly collect data from children. Since all data is stored locally and no data is transmitted, there are no concerns about children's data being shared with third parties.

## Security

### Data Security

- All data is stored using browser's secure local storage APIs
- No data is transmitted over the network
- No external servers to compromise
- Content Security Policy enforced

### Code Security

- Open source codebase (when available)
- No eval() or dangerous code execution
- Input validation and sanitization
- XSS protection (HTML escaping)

## Compliance

Shame Clock is designed to comply with:

- **GDPR** (General Data Protection Regulation)
- **CCPA** (California Consumer Privacy Act)
- **Browser extension store policies** (Chrome Web Store, Firefox Add-ons, Edge Add-ons)

Since **no data leaves your device**, Shame Clock inherently complies with privacy regulations by design.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in this document with an updated "Last Updated" date. We encourage you to review this policy periodically.

### Notification of Changes

- Significant changes will be noted in extension updates
- Review this document when updating the extension
- Continued use after changes constitutes acceptance

## Contact

If you have any questions about this privacy policy or how Shame Clock handles your data:

1. Review the extension's source code (when available)
2. Check the extension's support channels
3. Contact the developer through the extension's support channels

## Data Sovereignty

**Your data, your device, your control.**

Shame Clock is built on the principle of data sovereignty - you own and control all your data. We don't have servers, so we can't see your data. Everything happens locally, giving you complete privacy and control.

---

**Remember:** Shame Clock is designed to help you, not track you. All data stays on your device, and you can delete it anytime.

