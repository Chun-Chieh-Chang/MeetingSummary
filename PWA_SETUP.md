# PWA Setup Guide

## Overview
The MeetingSummary Pro app now supports PWA (Progressive Web App) features, allowing users to install it on their mobile devices and use it offline.

## Features
- **Install to Home Screen**: Users can add the app to their mobile home screen
- **Offline Support**: Service worker caches critical assets for offline use
- **Auto Updates**: New content is automatically fetched when available
- **Native App Experience**: No browser URL bar, standalone mode

## Files Created
- `manifest.webmanifest` - PWA manifest file
- `src/registerServiceWorker.ts` - Service worker registration
- `scripts/generate-pwa-icons.ts` - Icon generation script
- `public/icons/icons-192.png` - 192x192 app icon
- `public/icons/icons-512.png` - 512x512 app icon

## Usage

### Generate PWA Icons
```bash
npm run generate-pwa-icons
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Testing PWA
1. Build the project: `npm run build`
2. Preview: `npm run preview`
3. Open DevTools → Application → Manifest
4. Check "Installability" section
5. For offline testing, disable network in DevTools

## Browser Support
- Chrome/Edge (Android & Desktop): ✅ Full support
- Safari (iOS): ✅ Full support (iOS 11.3+)
- Firefox (Android): ✅ Full support
- Firefox (Desktop): ⚠️ Limited support (requires about:config changes)

## Configuration
Edit `vite.config.ts` to customize:
- Cache settings
- Workbox options
- Manifest properties
