# BLOCKHEADZ — Public Generative Console Demo

**BLOCKHEADZ** is a public-safe preview of a code-generated NFT character system built with **p5.js**, **WebGL**, seeded randomness, and modular rendering logic.

This repository does **not** reveal the final collection engine, final trait pools, rarity logic, production seeds, metadata, mint contracts, or unrevealed artwork.

It is a simplified public demo designed to show the core idea:

> BLOCKHEADZ are generated from code, not assembled from static image layers.

---

## Live Demo

This repo is ready for GitHub Pages.

After pushing to GitHub, enable:

```txt
Settings → Pages → Deploy from branch → main → /root
```

Then open the generated GitHub Pages URL.

---

## What This Demo Includes

- p5.js / WebGL rendering
- one consistent robot base
- exact `main.js` positioning preserved from the working prototype
- three public-safe character presets
- one fixed tunnel environment
- minimal console selector
- no final trait reveal
- no wallet or mint logic
- no whitelist, holder, or reward files

---

## Public Demo Characters

The demo exposes only three placeholder presets:

```txt
01 CLASSIC
02 SIGNAL
03 ARCADE
```

Direct links:

```txt
/?character=1
/?character=2
/?character=3
```

These are intentionally simplified and should not be treated as final collection outputs.

---

## Run Locally

Use any static server.

### Python

```bash
python3 -m http.server 3000
```

Open:

```txt
http://localhost:3000
```

### Node

```bash
npx serve .
```

---

## Project Structure

```txt
.
├── index.html
├── styles.css
├── favicon.ico
├── js
│   ├── main.js
│   ├── state.js
│   ├── constants.js
│   ├── controls.js
│   ├── builder_panel.js
│   ├── rng.js
│   └── parts
│       ├── body.js
│       ├── legs.js
│       ├── face.js
│       ├── eyes.js
│       ├── glasses.js
│       ├── hats.js
│       ├── mouths.js
│       └── tunnel.js
├── SAFE_RELEASE_CHECKLIST.md
└── PUBLIC_DEMO_FILE_MANIFEST.txt
```

---

## Files Intentionally Removed

The public demo intentionally excludes:

- final collection trait pools
- rarity weights
- metadata generation
- production seeds
- mint/reveal logic
- wallet logic
- holder snapshots
- whitelist/collab files
- reward/claim systems
- private render exports
- experimental recording scripts
- unrevealed visual systems

---

## Technical Notes

The render loop is intentionally minimal and public-safe.

Core flow:

```txt
seed / character param
        ↓
state.js applies one of three demo presets
        ↓
main.js renders a fixed robot base
        ↓
parts/*.js draw modular robot components
        ↓
builder_panel.js provides a small public console
```

The demo is deterministic for the exposed presets and uses URL parameters for direct navigation.

---

## Public-Safe Philosophy

Most NFT projects only show final media.

BLOCKHEADZ aims to show that the artwork is generated through a creative coding system while still protecting the unrevealed collection.

This repository is therefore a **technical proof-of-concept**, not the complete production engine.

---

## Official Links

Website: https://blockheadz.wtf/  
GitHub: https://github.com/blockheadz-lab/BLOCKHEADZ

---

## License

Public demo license to be finalized by the BLOCKHEADZ team before full release.

Do not assume rights to the final collection engine, unrevealed traits, production metadata, or brand assets unless a license is explicitly published.
