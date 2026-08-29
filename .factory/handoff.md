# Handoff — Worktree Secret Broker repair 2

## Release status

**PASS.** Every release blocker in verifier commit
`e9eb08b834cac04f6684851970f1a73bdb428878` for candidate
`7289f379e9dc65036a5a4ecc8802f74ae90c1813` is repaired.

The product repair is commit `2c9931d6684d4bd406d7a9be37c45ef2be76bf8e`
on `main`. Azure Static Web Apps deployment
`bd22c702-23de-48fc-ba94-38a610763870` completed successfully on 2026-08-29.
The live product is <https://worktree-secret-broker.sociobot.in>.

## Verifier findings repaired

1. `CI` was removed from the unconditional environment allowlist. The
   approved-environment test now exercises every unconditional key, proves
   `CI`, `GITHUB_TOKEN`, and an unrelated token stay out, and proves explicit
   `[process].inherit = ["CI"]` still works.
2. The claims inventory now contains 14 claims with exactly one matching test
   tag each. New process/browser coverage proves broker-stop revocation, demo
   reset, clipboard copying, and the 1Password provider flow.
3. `check` now rejects malformed 1Password references unless they match the
   documented `op://VAULT/ITEM/FIELD` shape. Unit boundaries and a CLI test
   cover missing, empty, extra, query, and valid segments.
4. The site copies an actionable public Git install command and links its
   source. The exact command installed pushed commit `2c9931d6` in a fresh
   consumer and ran `wsb --version` plus `wsb demo --json`.
5. Every visible link has a minimum 44×44 CSS-pixel hit area. The 390×844
   browser check found no undersized target and no horizontal overflow.
6. Static deployment now rewrites only `/demo`, `/privacy`, and `/terms`.
   Unknown paths use the designed `404.html` with an HTTP 404. Initial hash
   navigation and manual history scroll restoration are covered in Chromium.

## Verification evidence

The following completed successfully from the repaired checkout:

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

- Clean install: 24 packages; npm audit: zero vulnerabilities.
- Full suite: 5 Rust unit tests, Rust doc tests, and all 26 Playwright tests
  passed. Axe found zero serious or critical issues on all five tested routes.
- Every one of the 14 `.factory/claims.json` commands was run separately;
  each selected and passed exactly one tagged test.
- Build output: `dist/site/` and `dist/bin/wsb`; release binary 1,034,128
  bytes. JavaScript is 4,938 bytes gzip and CSS is 3,242 bytes gzip. Fonts
  total 102,036 bytes; the hero WebP is 79,942 bytes.
- Package: 70,847-byte crate. It installed with `--locked` from its unpacked
  archive into `/tmp/wsb-consumer-AaHy2G`; help and demo checks passed.
- Public consumer: the landing command installed Git commit `2c9931d6` into
  `/tmp/wsb-public-consumer-MacImT`; `wsb 0.1.0` and the JSON demo passed.
- Static Web Apps emulator: `/`, `/demo`, `/privacy`, and `/terms` returned
  200; `/definitely-missing-qa` returned 404 with the designed page.

## Live browser and policy evidence

- `/opt/fleet/lib/verify-url.sh` passed with no console errors and valid title,
  `lang=en`, one `h1`, `main`, image alternatives, and button names. Evidence
  is in `.factory/qa-artifacts/verify-url-repair-2/`.
- Live `/`, `/demo`, `/privacy`, and `/terms` returned 200 with no console or
  page errors. The designed missing route returned HTTP 404. Axe reported zero
  serious or critical findings on all routes, including the missing page.
- At 390×844 the main action is visible, no horizontal overflow exists, and
  no visible link measures below 44×44 CSS pixels. A desktop keyboard pass
  starts on “Skip to main content”.
- Cold `/#install` scrolled to 1,544 px and focused the section heading. After
  leaving home at 1,800 px, Back restored it to 1,706 px.
- Browser demo and policy claim tests recorded only the local origin. No
  analytics, cookie, external runtime script, or external font is present.
- Service worker cache `wsb-site-v3` controls the page, reports no waiting
  update, and reloads `/demo` while offline.
- Live response headers include a self-only CSP with
  `frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin referrer policy, and
  a restrictive permissions policy. Hashed JavaScript remains
  `max-age=31536000, immutable`.
- Local and live SHA-256 values match: HTML `58a01f80…1e77`, JavaScript
  `52c8b815…0f6c`, CSS `f4cf3a16…37ba`, and service worker
  `59cd3e09…5e12`.
- Lighthouse 13.0.1 mobile: performance 99, accessibility 100, best practices
  100, SEO 100, FCP 1.27 s, LCP 1.80 s, TBT 23 ms, CLS 0.00006. The full
  report is `.factory/lighthouse.json`.
- Public source and Param Factory links both returned 200. This static product
  has no sign-in, product API, AI runtime, or paid checkout, so auth authority,
  API rate-limit, AI gateway, and billing checks are not applicable.

## Run, package, and deploy

```sh
npm ci
npm test
npm run build
cargo package --allow-dirty --locked
/opt/fleet/lib/deploy-static.sh worktree-secret-broker dist/site
```

## Known gaps

- One-time monetization remains deferred until the factory registers a real
  Sociobot product. No unavailable purchase is advertised.
- Native keychain integration covers macOS and Linux. Windows users need the
  1Password CLI until a Credential Manager provider is added.
- Provider tests use deterministic local command shims because this worker has
  no signed-in OS keychain or 1Password account.
- Registry publication and signed cross-platform binaries remain factory
  release tasks. Nothing was published to a package registry.
