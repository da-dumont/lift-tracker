# Lift Tracker

12-Week Hybrid Strength & Mirror Program tracker.
PWA — works offline, installable to iPhone home screen.

**Live:** https://lift.ddumont.dev

## Local development

```
npx serve .
```

Open on iPhone Safari → Share → Add to Home Screen

## Deploy

Push to GitHub. Netlify auto-deploys on every push to `main`.
Bump `CACHE = 'lift-v2'` in `sw.js` when pushing updates to force a cache refresh on existing installs.

## Data

All data stored in browser localStorage. Never leaves the device.
Settings → Export to JSON to back up. Import to restore on a new device.
