# BLOCKHEADZ Public Demo — Safe Release Checklist

Use this checklist before pushing the demo to GitHub.

## Must Be Included

- [x] `index.html`
- [x] `styles.css`
- [x] `favicon.ico`
- [x] `js/main.js`
- [x] `js/state.js`
- [x] `js/constants.js`
- [x] `js/controls.js`
- [x] `js/builder_panel.js`
- [x] `js/rng.js`
- [x] `js/parts/body.js`
- [x] `js/parts/legs.js`
- [x] `js/parts/face.js`
- [x] `js/parts/eyes.js`
- [x] `js/parts/glasses.js`
- [x] `js/parts/hats.js`
- [x] `js/parts/mouths.js`
- [x] `js/parts/tunnel.js`
- [x] `README.md`

## Must Not Be Included

- [ ] final production trait pools
- [ ] final rarity weights
- [ ] final metadata generator
- [ ] production seeds
- [ ] collection reveal logic
- [ ] mint logic
- [ ] wallet connection logic
- [ ] whitelist files
- [ ] collab approval scripts
- [ ] holder snapshots
- [ ] reward/claim logic
- [ ] private API keys
- [ ] RPC keys
- [ ] `.env` files
- [ ] generated final PNG/GIF/WebP/MP4 outputs
- [ ] unrevealed collection assets

## Browser Check

Before publishing, run locally:

```bash
python3 -m http.server 3000
```

Then check:

```txt
http://localhost:3000
http://localhost:3000/?character=1
http://localhost:3000/?character=2
http://localhost:3000/?character=3
```

Open the browser console and confirm:

```txt
No missing JS files.
No missing CSS files.
No wallet prompts.
No mint prompts.
No private data loaded.
```

A missing favicon warning should not appear because `favicon.ico` is included.

## GitHub Pages

Recommended settings:

```txt
Settings → Pages → Build and deployment → Source: Deploy from branch
Branch: main
Folder: /root
```

## Public Messaging

Safe wording:

```txt
This repository is a simplified public demo of the BLOCKHEADZ generative console.
It proves the project uses code-based p5.js/WebGL rendering without revealing the final collection engine, traits, rarity tables, production seeds, or mint/reveal systems.
```

Avoid saying:

```txt
This is the full collection engine.
This is the final trait system.
This reveals the final art.
This is production mint code.
```
