# Independent verification 3 — Worktree Secret Broker

**Verdict: PASS.** Candidate `72ecd7e01429fc88bf2e543dbaf51ebd7a75a7e9` is releasable.

- Verified independently on 2026-08-29 (UTC)
- Live URL: <https://worktree-secret-broker.sociobot.in>
- Product source changed by this verification: **no**

## Required first checks

The checkout began at exactly the candidate commit. After `npm ci` from that
checkout, every command listed in `.factory/claims.json` was run separately
through the product test runner and its bundled demo entry points. All passed;
the command output is retained in `.factory/qa-artifacts/claims.log`.

| Claim | Result |
| --- | --- |
| `demo-isolated` | PASS |
| `approved-environment` | PASS |
| `names-only-receipt` | PASS |
| `production-denied` | PASS |
| `lease-expiry` | PASS |
| `worktree-root-required` | PASS |
| `demo-same-origin` | PASS |
| `recorded-demo-sample` | PASS |
| `site-no-analytics` | PASS |
| `policy-generator` | PASS |
| `broker-stop-revokes` | PASS |
| `demo-reset` | PASS |
| `copy-install-command` | PASS |
| `one-password-provider` | PASS |

Source cross-check found exactly one `@claim:<id>` test tag for each of the 14
claim IDs.

Cold-reading the deployed home page in a new browser context also passed the
mandatory gate. The first screen states what it does ("Lease secrets to one
worktree process"), who it is for (developers running coding agents), and the
first action ("Try it with sample data"), including the immediate result
("Opens an isolated recorded CLI run"). One click opens `/demo`, already
populated with realistic bundled names, a receipt, and the persistent
"Demo — sample data, nothing is saved" banner with Reset demo and Start for
real. Evidence: `qa-live-cold-desktop.png` and `qa-live-mobile-390.png`.

## Local quality gates

All commands completed successfully from the clean candidate checkout:

```sh
npm ci
npm test
npm run typecheck
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
npm audit --audit-level=high
npm run build
cargo package --allow-dirty --locked
```

- `npm test`: 5 Rust unit tests, Rust doc tests, and 26 Playwright tests passed.
- Production build created `dist/site/` and `dist/bin/wsb`; the release binary
  is 1,034,128 bytes.
- Produced JavaScript is 12,888 bytes (4,910 bytes gzip); CSS is 10,945 bytes
  (3,230 bytes gzip). The initial JS budget is comfortably below 200 KB.
- `cargo package` produced a 69.4 KB compressed crate. It was unpacked and
  installed into a fresh consumer prefix. The installed `wsb 0.1.0` returned
  useful help and completed `wsb demo --json` successfully.

## Independent CLI boundary checks

In addition to the claim suite, a fresh Git worktree and fake local
`secret-tool` provider were used to run the release binary. The fixture value
`process-history-sentinel-9z` reached the child only as `API_TOKEN`; it did not
appear in the broker command line, child command line, or names-only receipt.
The child ran as `sleep 2`; `/proc/<broker>/cmdline` contained only the config,
worktree, and command, while `/proc/<child>/cmdline` was only `sleep 2`.

The complete suite also independently covers normal use, explicit `CI`
inheritance and default exclusion, an unrelated parent token, production
denial, malformed 1Password references, missing-provider recovery, nested
worktree rejection, one-second expiry, SIGINT revocation, child exit
propagation, demo cleanup, and 1Password `op read` arguments.

## Live deployment, privacy, accessibility, and PWA

- Local production files and live files were SHA-256 identical for HTML, JS,
  CSS, service worker, fonts, images, favicon, robots, and sitemap. Examples:
  `index.html`/`404.html` `58a01f80…e1e77`, JS `52c8b815…0f6c`, CSS
  `f4cf3a16…37ba`, and service worker `59cd3e09…5e12`. The full manifest is
  `.factory/qa-artifacts/live-local-sha256.txt`.
- `/`, `/demo`, `/privacy`, and `/terms` each returned 200; an unknown route
  returned the designed page with HTTP 404. Normal-route loads had no console
  or page errors. The browser emits its native "Failed to load resource" log
  for the deliberate HTTP 404 document; it is not an application error.
- Fresh request logs for landing, demo, and policy-helper flows contained only
  `https://worktree-secret-broker.sociobot.in`; there are no analytics,
  third-party runtime requests, cookies, or external fonts/scripts.
- Response headers include a self-only CSP with `frame-ancestors 'none'`, HSTS,
  `nosniff`, strict-origin referrer policy, and restrictive permissions policy.
  Hashed JS/CSS are `max-age=31536000, immutable`; HTML and service worker use
  30-second revalidation.
- The factory `verify-url.sh` passed: title, `lang=en`, one `h1`, a `main`,
  zero missing image alts, zero unlabeled buttons, and zero console/page errors
  on the landing page. Evidence is in `qa-artifacts/verify-url-3/`.
- Axe found zero serious or critical issues on `/`, `/demo`, `/privacy`,
  `/terms`, and the not-found route. At 390×844 the primary action was visible,
  there was no horizontal overflow, and no visible interactive target was less
  than 44×44 CSS pixels. Keyboard starts at the skip link; invalid policy input
  gives a concrete error and a corrected input recovers. Reduced motion reduces
  animation and transition durations to `0.001ms` and uses instant scrolling.
- The service worker controlled `/demo`, had no waiting update after
  `registration.update()`, and reloaded the cached demo successfully offline.

Fresh mobile Lighthouse against the live URL scored Performance 96,
Accessibility 100, Best Practices 100, and SEO 100. Measured FCP was 1.1 s,
LCP 1.7 s, CLS 0, and TBT 220 ms. Report:
`qa-artifacts/lighthouse-verification.json`.

## Scope and defects

No defects were found. This is a static local-first CLI and site: it has no
sign-in, product API, AI runtime, paid checkout, or server-side endpoint.
Therefore Entra authority, API request-allowance/429, backend concurrency, and
billing checks are not applicable. The earlier deployment-only concern is
resolved by the fresh byte-for-byte live/candidate comparison above.
