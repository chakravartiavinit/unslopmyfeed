# unslopmyfeed

A Chrome extension to filter distracting content from your X/Twitter feed.

## Features

- 🎯 **Smart Filtering**: Automatically detects and blurs flex posts, crypto shilling, engagement bait, and distracting media
- 🧹 **Dusting Animation**: Premium cleaning animation when you activate filters
- 👁️ **Click to Reveal**: Easily view filtered content with one click
- ☁️ **Cloud Sync**: Sign in with Google to sync your settings across devices
- 🔒 **Privacy First**: Your data is encrypted and never shared

## Installation

### For Users

1. Download the latest release from the Chrome Web Store (coming soon)
2. Click "Add to Chrome"
3. Sign in with Google (optional) to sync settings
4. Visit X/Twitter and enjoy a cleaner feed!

### For Developers

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/unslopmyfeed.git
   cd unslopmyfeed
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase (for cloud sync features):
   - Follow instructions in `SUPABASE_SETUP.md`
   - Update `src/utils/supabase.js` with your credentials

4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `unslopmyfeed` directory

## Usage

1. Click the extension icon to open the popup
2. Toggle filters on/off for different content types:
   - Flex posts (humble brags, showing off)
   - Crypto shilling
   - Engagement bait
   - Distracting media (videos, thirst traps)
3. Click "Clean Feed Now" to apply filters with animation
4. Click "View Filtered Posts" to see what's being filtered
5. Click on any blurred post to reveal it

## Tech Stack

- **Frontend**: Vanilla JavaScript, CSS
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth

## Development

### Project Structure

```
unslopmyfeed/
├── src/
│   ├── auth/           # Authentication pages
│   ├── content/        # Content scripts for X/Twitter
│   ├── popup/          # Extension popup UI
│   └── utils/          # Shared utilities (Supabase client)
├── supabase/
│   └── migrations/     # Database schema
├── icons/              # Extension icons
├── manifest.json       # Extension manifest
└── background.js       # Background service worker
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Privacy

- Filter settings are stored locally by default
- Cloud sync is optional and requires Google sign-in
- No tracking or analytics
- Open source - audit the code yourself!

## License

MIT License - see LICENSE file for details

## Support

Found a bug? Have a feature request? [Open an issue](https://github.com/yourusername/unslopmyfeed/issues)