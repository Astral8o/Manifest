# Eventory

Discovery and sourcing for events. Pick an event type, see the supplier categories it
usually needs, browse suppliers with real price ranges, and add products to a single
Eventory. Sending goes out as one separate, scoped inquiry per supplier — no supplier
sees the rest of your list, and Eventory never handles payment.

Built with React + Vite.

## Screens

- **Home** — event type picker with a live categories checklist, plus a category grid.
- **Category** — suppliers for one category, filterable by location and group size.
- **Supplier** — a supplier's product list, with a running Eventory summary.
- **Eventory** — event details, line items grouped by supplier (with per-item
  specification fields), and the send flow.
- **Sourcing** — request form for anything not covered by a listed category.
- **Join** — supplier sign-up form.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
