# Rasu Games Website — Node.js

A polished football-studio landing page inspired by the supplied Rasu Games / Pro League Soccer screenshot.

## Run locally

Requirements: Node.js 18+

```bash
npm install
npm start
```

Then open http://localhost:3000

For development with Node's watch mode:

```bash
npm run dev
```

## Structure

- `server.js` — Express server and `/api/status` endpoint
- `public/index.html` — page structure/content
- `public/styles.css` — responsive visual design
- `public/app.js` — scroll reveal, cursor glow and mobile navigation
- `public/assets/hero-player.png` — local hero artwork

## Notes

The page is intentionally implemented as a clean studio redesign rather than a pixel-for-pixel copy. Replace the local hero artwork and placeholder news imagery with Rasu Games' licensed production assets before publishing.
