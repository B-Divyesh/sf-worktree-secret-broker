# Polish round 1 — review closure

Repaired and deployed from `fcc511287d6a9aa530b5404adfa26ccfe01b2eaa` on
2026-08-29 UTC. The deployed static artifact is live at
<https://worktree-secret-broker.sociobot.in>.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Added the direct `?demo=1` sandbox entry, an explicit `demo:` session namespace, Reset demo and Start for real cleanup that never enumerates real storage, and the accurate banner “nothing is saved to your real data.” Added `demo-browser-isolation` and `recorded-demo-receipt` claims. The CLI demo now emits stable bundled receipt timing so every displayed receipt field is comparable. | Clean-clone `npm test -- --grep @claim:demo-browser-isolation` and `npm test -- --grep @claim:recorded-demo-receipt` passed. Live fresh-context sentinel check passed at <https://worktree-secret-broker.sociobot.in/?demo=1>; screenshot: `qa-artifacts/polish-1-live/live-demo-mobile.png`. |
| F-1-2 | Added one metadata map used on client navigation for title, description, canonical, Open Graph, and Twitter metadata. The build now emits distinct static HTML for `/demo`, `/privacy`, `/terms`, and the real 404 document, instead of rewriting those URLs to home HTML. | `each route updates its social metadata after client navigation` and `production output emits real routes and a designed HTTP 404 override` passed. Live checks passed for `/demo`, `/privacy`, `/terms`, and `/missing`; `/missing` returned HTTP 404. |
| F-1-3 | Rewrote the hero caption as “Only approved variables reach the named worktree process.” | Landing copy audit and live desktop screenshot: `qa-artifacts/polish-1-live/home-desktop.png`. |
| F-1-4 | Replaced “See the boundary” with “Sample names-only receipt.” | Landing copy audit and live desktop screenshot: `qa-artifacts/polish-1-live/home-desktop.png`. |
| F-1-5 | Replaced “Approve, run, revoke” with “Run one worktree process in three steps.” | Landing copy audit and live desktop screenshot: `qa-artifacts/polish-1-live/home-desktop.png`. |
| F-1-6 | Replaced the demo headline with “See the CLI run with sample worktree data.” | `@claim:demo-browser-isolation`, `offline reload works after the service worker controls the built demo`, and the live screenshot `qa-artifacts/polish-1-live/live-demo-mobile.png` passed. |

## Cumulative review check

There were no earlier `review-*.md` or `polish-*.md` files. Earlier
verification findings were rechecked through the complete suite: no checkout
is advertised, the source install command remains actionable, production
labels remain denied by default, malformed 1Password references fail during
check, mobile links retain 44 px targets, deep links and Back restore state,
and the site serves a real HTTP 404.

## Exact verification evidence

- Fresh clone: `/tmp/wsb-clean-ljliP8/repo` at
  `fcc511287d6a9aa530b5404adfa26ccfe01b2eaa`; `npm ci`, `npm test`,
  `npm run build`, `cargo package --allow-dirty --locked`, and
  `npm audit --audit-level=high` passed.
- Every one of the 16 exact commands in `.factory/claims.json` passed from
  that fresh clone. The command log ended with `ALL_CLAIMS_PASS`.
- Live `verify-url.sh` passed for `?demo=1`; output and screenshots are in
  `qa-artifacts/polish-1-live/verify.json`, `screenshot-desktop.png`, and
  `screenshot-mobile.png`.
- A live Playwright + Axe scan passed with zero serious or critical violations
  on `/`, `/demo`, `/privacy`, `/terms`, and `/missing`. The only native
  browser console message on `/missing` was its expected HTTP 404 resource
  load; normal routes had zero console or page errors.
