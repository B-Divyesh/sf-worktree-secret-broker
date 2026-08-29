# Polish round 2 handoff — Worktree Secret Broker

## Result

PASS. Every finding in `.factory/review-1.md` and `.factory/review-2.md` is
closed. The repaired static site was deployed from product commit
`a9d1ac3aeefe64c5e8bb8f73885bb1268c03e78d` to
<https://worktree-secret-broker.sociobot.in> with Azure deployment
`9530821f-f7ac-4d53-a023-58c221b58fd5`.

The key-orchard visual system, Rust CLI artifact class, and static-site
deployment class are unchanged. No AI or payment feature was added because
neither belongs in this deterministic local secret boundary.

## Changes

- Added `os-keychain-provider` to `.factory/claims.json`. Its tagged test
  runs the Linux provider end to end and checks the exact `secret-tool`
  arguments, cleared child environment, names-only receipt, and provider
  value exclusion. The shared Rust command contract also asserts the exact
  macOS `security find-generic-password -s SERVICE -a ACCOUNT -w` invocation.
- Added `policy-helper-input-boundary`. Its tagged browser test inventories
  the form controls, proves there is no secret-value input, rejects duplicate
  names with the actionable error, emits no TOML, and records request origins.
- Replaced the landing label “A narrow tool” with “Limits”. Split the
  23-word README sentence into three short setup sentences.
- Made the skip-link destination focusable and covered direct `/#main`,
  direct `/#install`, SPA route focus, and Back restoration.
- Updated the catalog line to “Give one worktree process only its approved
  development secrets.” (64 characters, verb first).
- Rechecked all earlier demo, metadata, route, 404, legal, mobile, copy,
  privacy, offline, and accessibility repairs. The full mapping is in
  `.factory/polish-2.md`.

## Clean-clone evidence

Acceptance commit `e2540b3290e029906e4be5b0ff28ac71c28f6ae6`
was cloned without shared working files to
`/tmp/wsb-polish2-accept.Uzltcu/repo`.

- `npm ci`: passed; 0 vulnerabilities.
- Every one of the 18 commands in `.factory/claims.json` ran separately and
  passed, ending with `ALL 18 CLAIMS PASS`.
- `npm test`: passed 32/32 Playwright integration tests, 6/6 Rust unit tests,
  Rust doc tests, `cargo fmt --check`, clippy with warnings denied,
  TypeScript checking, the production site build, browser Axe checks,
  privacy request checks, demo storage isolation, offline reload, mobile,
  keyboard, metadata, real routes, and the HTTP 404 artifact.
- `npm run build`: passed and created `dist/site/` plus `dist/bin/wsb`.
- `cargo package --allow-dirty --locked`: passed package creation and
  verification (249.5 KiB unpacked; 71.6 KiB compressed).
- `npm run check:macos`: passed for `x86_64-apple-darwin`.
- `npm audit --audit-level=high`: passed with 0 vulnerabilities.
- Initial bundles: JS 13.85 kB raw / 5.14 kB gzip; CSS 10.95 kB raw /
  3.23 kB gzip.

## Live evidence

- Factory URL verifier passed `/` and `/?demo=1` with no console errors,
  one h1, one main landmark, `lang=en`, complete alt text, and labeled
  buttons. Evidence: `.factory/qa-artifacts/polish-2-live/home/` and
  `.factory/qa-artifacts/polish-2-live/demo/`.
- The cold browser audit passed `/`, `/demo`, `/privacy`, and `/terms` at
  HTTP 200 and `/missing` at HTTP 404. Each route has its own title,
  description, canonical, Open Graph title, and Twitter title. Every route
  has zero serious/critical Axe findings and zero unexpected console or page
  errors: `.factory/qa-artifacts/polish-2-live/live-audit.json`.
- One click reached `/?demo=1`. Reset retained only `demo:session`; Start for
  real removed it; real local/session sentinels remained unchanged. All
  observed route requests were same-origin.
- At 390 × 844, scroll width equaled 390, the primary action ended at
  514.7 px in the first screen, and no visible target was below 44 × 44 px.
- At 200% text size, page width remained 390 px and the h1 stayed visible.
- Reduced-motion media matched and reduced the one entrance animation to
  0.001 ms with one iteration.
- Skip activation focused `<main>`; SPA navigation focused the demo h1.
- The service-worker-controlled `/demo` reloaded offline with its heading and
  persistent demo banner.
- Lighthouse mobile: performance 100, accessibility 100, best practices 100,
  SEO 100; LCP 1.8 s, FCP 1.1 s, total blocking time 40 ms, CLS 0. Evidence:
  `.factory/qa-artifacts/polish-2-live/lighthouse-live.json`.
- Cold screenshots:
  `.factory/qa-artifacts/polish-2-live/cold-home-desktop.png`,
  `.factory/qa-artifacts/polish-2-live/cold-home-mobile-390.png`, and
  `.factory/qa-artifacts/polish-2-live/demo-after-one-click.png`.

## Run and verify

```sh
npm ci
npm test
npm run build
cargo package --allow-dirty --locked
rustup target add x86_64-apple-darwin
npm run check:macos
```

The deploy root is `dist/site`. Registry publishing remains a factory task;
the worker did not publish the Rust package.

## Known gaps and next steps

None within the brief or cumulative adversarial review. No finding, stub, or
TODO remains.
