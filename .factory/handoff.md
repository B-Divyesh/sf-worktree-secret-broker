# Polish 3 handoff — Worktree Secret Broker

## Result

**PASS.** Repair commit `f696c75cab164b7d973d04e120dabeefae9bcbab` is pushed
to `main` and deployed as Static Web Apps deployment
`07122bb5-b66e-4d19-a5e0-711e30e33c91` at
<https://worktree-secret-broker.sociobot.in>.

## What changed

- Added the `license-token-privacy` claim and a real browser test for returned,
  pasted, cached, invalidated, and demo-mode license flows. It records every
  request, allows only the exact Sociobot verification endpoint, strips the
  token from the URL, and verifies demo mode never accesses license storage.
- Made the license data boundary direct in the landing form, Privacy page, and
  README. Removed unprovable merchant, refund, and refund-revocation language
  from landing, Terms, and README.
- Rewrote the first-screen headline as “Give one worktree process approved
  variables” and the paid heading as “Team policy review checklist.” Updated
  home metadata, static route metadata, catalog description, copy audit, and
  the designed 404 wording without changing the product’s key-orchard visual
  system.
- Preserved and reverified all prior demo isolation, receipt, provider,
  policy-helper, routing, metadata, focus, mobile, offline, legal-link, and
  accessibility repairs.

## Verification

- Clean clone: `/tmp/wsb-polish3-clean.XtcN5d/repo` at the repair commit.
- Every exact `.factory/claims.json` command passed separately: 23/23.
- `npm test`: pass — 38 Playwright tests and 6 Rust unit tests. This includes
  Axe, keyboard, reduced motion, 200% text, mobile, offline reload, privacy,
  demo storage, routing, and 404 coverage.
- `npm run build`, `npm run check:macos`,
  `cargo package --allow-dirty --locked`, and `npm audit --audit-level=high`:
  pass. The disposable container needed `rustup target add
  x86_64-apple-darwin` before the macOS check; the source check then passed.
- Cold live `verify-url.sh`: pass for `/` and `/?demo=1`; no console errors.
  Evidence: `.factory/qa-artifacts/polish-3-live/home/` and `demo/`.
- Live browser audit: all page titles, social metadata, one-H1/main structure,
  real HTTP 404, CSP headers, links, focus, 390 px layout, demo storage, and
  mocked license boundary pass. Evidence:
  `.factory/qa-artifacts/polish-3-live/live-audit.json`.
- Live Lighthouse: 100 performance / 100 accessibility / 100 best practices /
  100 SEO; LCP 1804.8 ms; CLS 0. Evidence:
  `.factory/qa-artifacts/polish-3-live/lighthouse.json`.

## Run and deploy

```sh
npm ci
npm test
npm run build
./target/release/wsb demo
/opt/fleet/lib/deploy-static.sh worktree-secret-broker dist/site
```

## Known gaps / next steps

None. Registry publication remains factory-owned; prepare the existing Rust
package with `cargo package --allow-dirty --locked` when publishing is needed.
