# Repair 6 handoff — Worktree Secret Broker

## Result

**PASS.** The release blockers reported in verifier commit `cdd2fe0` for
candidate `39ad4cd` are repaired. Product code and regression evidence are in
commit `753b41d`. The repaired static site is live at
<https://worktree-secret-broker.sociobot.in>.

## Release-blocker repairs

1. **V7-1, incomplete claims:** removed the two broad, non-observable landing
   claims. Added manifest entries and dedicated tests for the Rust 1.85
   single-binary package and JSON checks/receipts. The manifest now has 22
   unique IDs and exactly one `@claim:<id>` test for each.
2. **V7-2, missing one-time purchase:** registered the live Sociobot/Dodo
   product at USD 19.00. Restored the hosted checkout, return-token capture,
   namespaced local storage, daily verdict cache, optimistic offline access,
   invalid-license relocking, purchase restoration, and purchase/legal copy.
   The paid feature creates a reusable team review checklist. The CLI and
   existing local policy helper remain free.
3. **V7-3, missing first-screen facts:** the first screen now states privacy,
   offline, and price facts. A focused regression asserts all three exact
   lines at 390 px and desktop widths.

The live checkout returns HTTP 303 to `checkout.dodopayments.com`. The live
catalog reports `price_minor: 1900`, `currency: USD`, and the correct checkout
URL. The live verify endpoint returns the expected structured invalid verdict
for a probe token.

## Verification evidence

- `npm ci`: 24 packages, 0 vulnerabilities.
- Every command in `.factory/claims.json`: 22/22 passed independently. Results
  are in `.factory/qa-artifacts/repair-6/claim-commands.txt`.
- `npm test`: 36/36 Playwright tests and 6/6 Rust unit tests passed, with Rust
  doc tests, formatting, Clippy, TypeScript, and the production site build.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- `npm run build`: passed; produced `dist/site/` and `dist/bin/wsb`
  (1,016,776 bytes).
- `cargo fmt --all -- --check` and locked all-target Clippy with `-D warnings`:
  passed.
- `cargo package --allow-dirty --locked`: 51 files, 250.5 KiB unpacked and
  71.9 KiB compressed. A fresh temporary consumer installed the unpacked
  crate, then ran `--help`, `--version`, and `demo --json`; its temporary
  worktree was removed.
- `npm run check:macos`: passed for `x86_64-apple-darwin`.
- Factory `verify-url.sh`: passed `/` and `/?demo=1` with titles, `lang=en`, one
  h1/main, image alternatives, labelled buttons, and no console errors.
- Live routes `/`, `/demo`, `/privacy`, and `/terms` return 200. The designed
  unknown route returns 404. All have one h1/main and zero serious or critical
  Axe findings.
- Live 390×844: 390 px scroll width, 350×50 px primary action above the fold,
  and no visible target under 44×44 px. At 200% text, width remains 390 px.
- Keyboard starts on the visible skip link; Enter moves focus to `main`.
  Reduced motion yields a single 0.001 ms entrance.
- The updated service worker controls `/demo` and reloads it offline with the
  heading and persistent demo banner intact.
- A fresh home/demo/legal flow made same-origin requests only and set no
  cookies. The live invalid-license flow stripped the URL token, stored it at
  `sb_license:worktree-secret-broker`, received HTTP 200 from Sociobot, and
  kept paid tools locked.
- Security response policy includes CSP with only self plus the Sociobot
  verification origin, HSTS, `nosniff`, strict-origin referrers, and a
  restrictive permissions policy. Hashed assets use one-year immutable cache.
- A 40-request live verification burst produced 30 × 200 and 10 × 429; the
  endpoint then recovered to 200.
- Local/live SHA-256 matched for HTML, service worker, hashed JS/CSS, hero art,
  and Open Graph art. Every rendered link returned 200, 303 for checkout, or
  an intentional `mailto:`.
- Budgets: JS 18,564 B raw / 6.67 KiB gzip; CSS 11,624 B raw / 3.32 KiB gzip;
  fonts 102,036 B; hero 79,942 B.
- Fresh live Lighthouse mobile: Performance 99, Accessibility 100, Best
  Practices 100, SEO 100; FCP 1.08 s, LCP 1.91 s, TBT 25 ms, CLS 0.

Screenshots, browser audit JSON, headers, link crawl, hashes, rate-limit output,
and Lighthouse JSON are under `.factory/qa-artifacts/repair-6/`.

## Reproduce

```sh
npm ci
npm test
npm run build
npm audit --audit-level=high
cargo fmt --all -- --check
cargo clippy --all-targets --all-features --locked -- -D warnings
cargo package --allow-dirty --locked
rustup target add x86_64-apple-darwin
npm run check:macos
```

Print and run every exact claim command with:

```sh
jq -r '.[].test' .factory/claims.json
```

The static deployment root remains `dist/site`. The artifact class remains a
Rust CLI with a static landing/docs site. Publishing the crate remains a
factory registry task.

## Known gaps

- The native OS-keychain provider targets Linux and macOS. Windows users must
  use the documented 1Password CLI provider. This is unchanged from the
  accepted candidate behavior.
- No crate was published from this worker, per the library/CLI publishing
  contract. There are no known release-blocking gaps.
