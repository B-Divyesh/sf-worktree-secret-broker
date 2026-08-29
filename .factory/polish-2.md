# Polish round 2 — cumulative review closure

Deployed product commit `a9d1ac3aeefe64c5e8bb8f73885bb1268c03e78d`
to <https://worktree-secret-broker.sociobot.in> on 2026-08-29 UTC. The final
deployment id is `9530821f-f7ac-4d53-a023-58c221b58fd5`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Retained the direct isolated `?demo=1` entry, explicit `demo:` namespace, Reset demo, Start for real cleanup, persistent banner, and full browser/CLI receipt comparison. | `@claim:demo-isolated`, `@claim:demo-reset`, `@claim:demo-browser-isolation`, and `@claim:recorded-demo-receipt` passed independently in the final clean clone. Live sentinels and storage states pass in `qa-artifacts/polish-2-live/live-audit.json`; screenshot: `qa-artifacts/polish-2-live/demo-after-one-click.png`; live URL: <https://worktree-secret-broker.sociobot.in/?demo=1>. |
| F-1-2 | Retained per-route static HTML and client metadata maps for title, description, canonical, Open Graph, and Twitter data, plus the real HTTP 404 override. | `production output emits real routes and a designed HTTP 404 override` and `each route updates its social metadata after client navigation` passed. The live audit records distinct metadata for `/`, `/demo`, `/privacy`, `/terms`, and HTTP 404 `/missing`. |
| F-1-3 | Retained “Only approved variables reach the named worktree process.” | `@claim:approved-environment` passed; the copy appears in `qa-artifacts/polish-2-live/cold-home-desktop.png` and at the live home URL. |
| F-1-4 | Retained the useful section label “Sample names-only receipt.” | Final copy audit passes; visible in `qa-artifacts/polish-2-live/cold-home-mobile-390.png` and at the live home URL. |
| F-1-5 | Retained “Run one worktree process in three steps.” | Final copy audit passes; heading outline and Axe checks pass in `qa-artifacts/polish-2-live/live-audit.json`. |
| F-1-6 | Retained “See the CLI run with sample worktree data.” | `@claim:demo-browser-isolation` and the offline demo test passed. The live direct demo, offline reload, title, h1, and banner pass in `qa-artifacts/polish-2-live/live-audit.json`. |
| F-2-1 | Added the `os-keychain-provider` claim and exact tagged test. Refactored provider command construction so the production path and test share one Linux/macOS command contract. The Linux sandbox verifies `secret-tool lookup service my-app account database-url`, resolved-value scoping, and names-only output; the Rust contract verifies `security find-generic-password -s my-app -a database-url -w`. | `npm test -- --grep @claim:os-keychain-provider` passed independently in the final clean clone; `tests::os_keychain_provider_contract` passed; `npm run check:macos` passed. The documented provider text is live under “Map approved names.” |
| F-2-2 | Added `policy-helper-input-boundary` and converted the former duplicate regression into its one exact tagged claim test. It inventories every form control, proves no secret-value control exists, submits duplicates, asserts the actionable error and no TOML, and permits no third-party request. | `npm test -- --grep @claim:policy-helper-input-boundary` passed independently. Live audit reports `helperInputs: 0`, one names textarea, the duplicate error, and same-origin-only route requests. |
| F-2-3 | Replaced the 23-word README sentence with: “Lease expiry stops the child process. Stopping the broker also stops it. Each run then prints a names-only receipt.” | `.factory/copy-audit.md` has no over-22-word or banned-word finding; final clean-clone README check and full suite passed. |
| F-2-4 | Replaced the vague “A narrow tool” eyebrow with “Limits.” | Final copy audit passes; live audit records `limitsLabel: LIMITS`; screenshots: `qa-artifacts/polish-2-live/cold-home-desktop.png` and `cold-home-mobile-390.png`. |

## Additional cold-live correction

The final live keyboard audit exposed that a cold `/#main` could focus a
descendant heading. The main landmark is now focusable, direct `/#main`
focuses it, and SPA route changes focus the destination h1. The tests
`cold hash links and browser Back restore their exact destinations` and
`keyboard starts at the skip link and operates the policy helper` pass. Live
evidence records `afterSkip: MAIN` and `routeFocus: H1`.

## Final acceptance evidence

- Final clean clone: `/tmp/wsb-polish2-accept.Uzltcu/repo` at acceptance
  commit `e2540b3290e029906e4be5b0ff28ac71c28f6ae6`.
- Every one of 18 declared claim commands: passed independently.
- Full suite: 32/32 browser tests and 6/6 Rust tests passed.
- Build, package verification, macOS cross-check, and dependency audit: pass.
- Live verifier, route crawl, Axe, privacy/storage flow, keyboard, mobile,
  reduced-motion CSS coverage, and offline reload: pass.
- Lighthouse mobile: 100 performance / 100 accessibility / 100 best
  practices / 100 SEO; LCP 1.8 s; CLS 0.

No cumulative finding remains open.
