# unslopmyfeed 🧹🛡️

**unslopmyfeed** is a premium, AI-enhanced Chrome extension designed to purify your X/Twitter experience. It automatically identifies and eliminates "slop"—low-value content like humble-brags, crypto shilling, and engagement bait—leaving you with a focused, high-signal feed.

![unslopmyfeed UI State](https://img.shields.io/badge/Feed_State-Pure_✨-blueviolet?style=for-the-badge)
![Chrome Extension V3](https://img.shields.io/badge/Version-Manifest_V3-blue?style=for-the-badge)

## 🎯 Features

### 1. "Nuke" Categories
Filter content with surgical precision using our pre-defined intelligence categories:
- 💪 **Status Flexing**: Automatically blocks "humble brags," revenue screenshots, and hustle-culture monologues.
- 🚀 **Crypto Shilling**: Nukes token launches, moon-shots, and unsolicited financial advice.
- 🎣 **Engagement Bait**: Filters out "agree?" threads, retweet-for-PDFs, and "thoughts?" polls.
- 🔞 **Media Slop**: Detects and blurs distracting or suggestive video content using visual heuristics.

### 2. Premium Experience
- ✨ **Dusting Animation**: A custom blue-particle sweep animation clears the slop from your screen in real-time.
- 🌈 **High-End UI**: Built with a sleek dark theme featuring glassmorphism, mesh gradients, and smooth state transitions.
- 📊 **Real-time Stats**: Track your browsing health with live "Filtered Slop" and "Lifetime Blocked" counters.

### 3. Intelligence & Sync
- ☁️ **Cloud Intelligence**: Sync your filters and block history across devices using **Supabase** and **Google OAuth**.
- 🛡️ **Privacy-First**: Filtering happens locally on your machine. Analytics are anonymized and only used to improve detection accuracy.

---

## 🚀 Installation

### For Users
1. Download the extension from the [Chrome Web Store](https://chrome.google.com/webstore) (Soon).
2. Click the 🧹 icon in your toolbar.
3. Visit X/Twitter and watch the slop disappear.

### For Developers
1. **Clone the repo**:
   ```bash
   git clone https://github.com/yourusername/unslopmyfeed.git
   cd unslopmyfeed
   ```
2. **Setup Dependencies**:
   ```bash
   npm install
   ```
3. **Supabase Config**:
   - Create a project at [supabase.com](https://supabase.com).
   - Update `src/popup/popup.js` with your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
4. **Load Extension**:
   - Go to `chrome://extensions/`.
   - Enable **Developer mode**.
   - Click **Load unpacked** and select the project folder.

---

## 🛠️ Tech Stack

- **Core**: JavaScript (ES6+), HTML5, CSS3
- **Styling**: Vanilla CSS (Custom Glassmorphism Design System)
- **Backend/Auth**: Supabase (PostgreSQL, GoTrue)
- **Manifest**: Chrome Extension API V3

---

## 📂 Project Structure

```
unslopmyfeed/
├── icons/              # Premium branded icons (PNG)
├── src/
│   ├── auth/           # Supabase Auth bundles & login logic
│   ├── content/        # DOM observers and filtering engines
│   ├── popup/          # The main dashboard UI & styling
│   └── utils/          # Client initializers
├── background.js       # Global state & session manager
└── manifest.json       # extension permissions & routing
```

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.

---

## 🤝 Support
In case the cleaning doesn't trigger, simply **reload the page** or click the "Clean Feed" button in the extension dashboard.

[Report a Bug](https://github.com/yourusername/unslopmyfeed/issues) | [Request a Feature](https://github.com/yourusername/unslopmyfeed/issues)