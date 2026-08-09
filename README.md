# Mellow Bay

Site for Mellow Bay Living — a beachfront coliving, coworking space and
restaurant in Weligama, Sri Lanka.

Live at <https://ravinduyas.github.io/mellow-bay/>

## Layout

The repository is a workspace; the site is one part of it.

| Path              | Contents                                              |
| ----------------- | ----------------------------------------------------- |
| `frontend/`       | The React + Vite site. Everything currently deployed.  |
| `backend/`        | Reserved — empty.                                     |
| `booking-engine/` | Reserved — empty.                                     |
| `.github/`        | The Pages deploy workflow. Must stay at the root.      |

## Run locally

Prerequisites: Node.js 20.

```sh
cd frontend
npm install
npm run dev
```

`npm run dev` serves from `/mellow-bay/` to match production. To serve from the
root instead, set `BASE_PATH=/`.

Other scripts, all from `frontend/`:

```sh
npm run lint     # tsc --noEmit
npm run build    # production build into frontend/dist
npm run preview  # serve the built output
```

Copy `frontend/.env.example` to `frontend/.env.local` and fill in the values if
you need the Gemini-backed features.

## Deployment

Pushing to `main` builds `frontend/` and publishes `frontend/dist` to GitHub
Pages via `.github/workflows/deploy.yml`.

The repository's Pages source must stay set to **GitHub Actions** (Settings →
Pages). Switching it to "Deploy from a branch" makes GitHub serve the raw repo
root instead of the built output, which renders as a blank page.

Deep links rely on `frontend/public/404.html`, which encodes the path into a
query string that `index.html` decodes before React Router reads the URL. This
is the standard SPA workaround for Pages; a direct hit on a subpage returns a
404 status before the redirect resolves.
