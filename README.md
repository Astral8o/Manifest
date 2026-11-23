# EventoryTT

Deals, promotions and things to do in Trinidad & Tobago. Vite + React + TypeScript single-page app, deployed on Vercel (project `manifest`, eventorytt.com).

## Develop

```sh
npm install
npm run dev       # local dev server
npm run build     # type-check + production build to dist/
```

## Deploy

Pushing to the repo's default branch deploys to production on Vercel automatically. Any other branch gets a preview URL.

## Layout

- `src/data.ts`: demo deals (all fictional), categories, collections, filtering.
- `src/store.tsx`: app state, hash routing (`#/deal/<id>`, `#/browse`, …), saved deals in `localStorage`.
- `src/components/`: `DealCard`, header/tab bar/footer, pass modal, toast, starburst badge.
- `src/screens/`: Home, Browse, DealPage, Things, Saved, Submit, DesignSystem.
- `project/`, `chats/`: the original Claude Design handoff (prototype `EventoryTT.dc.html`). Reference only, not built.

## Not wired up yet

Photos are placeholders. Claim buttons, the Friday Five sign-up and the Submit a Deal form show demo messages; nothing is sent to a backend.
