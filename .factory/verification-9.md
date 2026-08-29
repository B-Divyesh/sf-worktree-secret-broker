# Independent verification 9 — Worktree Secret Broker

## Verdict

**PASS.** Candidate `dd573d678363d15aa3338695222302d53caece5e` meets the
supplied acceptance contract. All 23 claim tests pass from the source-clean
checkout after the required locked dependency install, and the live deployment
byte-matches the candidate build.

Verified independently on 2026-08-29 UTC at
<https://worktree-secret-broker.sociobot.in>. Product code was not modified.

## Clean-clone claim gate

The checkout began source-clean and exactly at the candidate:

```text
$ git rev-parse HEAD
dd573d678363d15aa3338695222302d53caece5e
$ git status --short
(no output)
```

I read `.factory/claims.json` before broader product inspection. An initial raw
invocation before dependency installation stopped in the shared runner before
any claim test was selected:

```text
> worktree-secret-broker-site@0.1.0 typecheck
> tsc --noEmit
sh: 1: tsc: not found
```

This was a verifier prerequisite error, not a failing claim assertion: the
repository declares TypeScript in `devDependencies`, and the requested
clean-checkout procedure separately requires installation. I then ran
`npm ci` from the unchanged checkout and invoked all 23 exact manifest commands
separately. All 23 passed. The manifest has 23 unique IDs, every required
field, exactly one matching `@claim:<id>` tag per ID, and no orphan tags.

## First-read and one-click demo

**PASS.** A cold live load answers all three questions above the fold on both
1440×900 desktop and 390×844 mobile:

- What: **“Give one worktree process approved variables.”**
- For whom: **“For developers running coding agents…”**
- First action: **“Try it with sample data,”** followed by “Opens an isolated
  recorded CLI run.”

The first screen also presents the privacy, offline, and price facts. One click
opens the populated sample with a persistent “Demo — sample data, nothing is
saved to your real data” banner, **Reset demo**, and **Start for real**.
Reset restores the sample. Starting for real removes all `demo:` session keys
and the banner. The CLI's `wsb demo --json` emits the same names and receipt
fields and removes its temporary worktree.

## Claim results

Every exact command below passed after the clean lockfile install:

| Claim ID | Result |
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
| `demo-browser-isolation` | PASS |
| `recorded-demo-receipt` | PASS |
| `copy-install-command` | PASS |
| `one-password-provider` | PASS |
| `os-keychain-provider` | PASS |
| `policy-helper-input-boundary` | PASS |
| `public-source-install` | PASS |
| `json-output` | PASS |
| `offline-demo` | PASS |
| `paid-team-review` | PASS |
| `license-token-privacy` | PASS |

I cross-checked the rendered landing copy and README against the manifest and
found no unlisted product claim.

## Installed repository gates

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 24 packages, zero audit vulnerabilities |
| `npm test` | PASS — 38 Playwright tests and 6 Rust unit tests |
| `npm run typecheck` | PASS |
| `cargo fmt --all -- --check` | PASS |
| `cargo clippy --all-targets --all-features --locked -- -D warnings` | PASS |
| `npm run build` | PASS — exact production output in `dist/` |
| `npm audit --audit-level=high` | PASS — zero vulnerabilities |
| `npm run check:macos` | PASS after installing the container's missing Rust target |
| `cargo package --locked --allow-dirty` | PASS — 51 files, 250.4 KiB / 71.9 KiB compressed |

## CLI and package exercise

The packed crate installed into a fresh temporary prefix and produced one
`wsb` binary. `wsb --version` returned `wsb 0.1.0`; `wsb init` generated the
documented names-only config; and `wsb demo --json` returned `DATABASE_URL` and
`NPM_TOKEN` before deleting its temporary worktree.

Independent direct probes passed:

- a normal fake-keychain lease injected only `API_TOKEN`, cleared an unrelated
  parent secret, printed no resolved value, and returned a names-only receipt;
- child exit code 7 propagated as CLI exit 7 and receipt code 7;
- lease boundaries 1 and 1440 passed; 0 and 1441 failed with an actionable
  range error;
- wrong version, no secrets, duplicates, invalid environment names, unknown
  fields, unsupported sources, nested worktree roots, failed providers, and
  empty provider values were rejected;
- production-labelled input was denied by default and accepted only with the
  explicit override; and
- correcting a failed provider allowed the next run to succeed.

The full suite additionally passed 1Password and Linux/macOS keychain command
contracts, expiry code 124, SIGINT/SIGTERM/SIGHUP revocation, broker-parent
death, descendant process-group cleanup, Git-diff secret checks, and JSON
output parsing.

## Live deployment and browser QA

- Local and live SHA-256 hashes matched for `index.html`, all four routed HTML
  documents, the designed 404, service worker, hashed JS/CSS, three fonts,
  hero art, Open Graph art, robots file, and sitemap. The deployed site is the
  candidate output. Candidate `dd573d6` changes documentation only over its
  product parent `f696c75`.
- `/`, `/demo`, `/privacy`, and `/terms` returned 200. An unknown route returned
  the designed 404 with HTTP 404. Each page has its own title, `lang=en`, one
  `<h1>`, one `<main>`, a skip link, canonical and social metadata.
- `/opt/fleet/lib/verify-url.sh` passed home and `/?demo=1`: no errors, one H1,
  main landmark, and no missing image alt or button label.
- Fresh Axe scans found zero violations, including zero serious or critical
  findings, on home, demo, privacy, terms, and 404.
- Keyboard order starts at the skip link; Enter moves focus to `<main>`.
  Every sampled focus target has a visible 3 px coral outline. Keyboard entry,
  select arrows, and Enter generated a valid policy.
- At 390 px, home and demo did not overflow. Every visible home link, button,
  input, select, and textarea measured at least 44 px in each dimension. At
  200% root text, the first action and H1 remained visible without overflow.
- Reduced-motion media matched; the sole entrance animation had an effective
  duration of 0.001 ms and scrolling was automatic.
- Normal routes produced no console or page errors. The deliberate HTTP 404
  produced only the browser's expected failed-resource console line.
- Every internal route and fragment resolved. GitHub, Sociobot, and Param
  Factory links returned 200. The buy link correctly went first to Sociobot
  and returned 303 to hosted checkout. The `mailto:` link was excluded from
  HTTP status testing.

## Privacy, unlock boundary, and rate limiting

Cold home, demo, privacy, terms, demo reset/exit, and policy generation made
only same-origin requests. There are no analytics or CDN requests. An explicit
invalid-license action made exactly one third-party request, to the documented
`https://api.sociobot.in/api/v1/products/worktree-secret-broker/verify`
endpoint. It stored only the two documented namespaced license keys, kept paid
tools locked, and displayed an actionable inactive-license message.

A direct single-client burst against that unlock endpoint received 30 HTTP 200
responses. Request 31 and the next two received HTTP 429 with `Retry-After: 3`,
then `2`. The observed allowance is therefore 30 requests in that burst window.
The product has no other backend, sign-in, AI endpoint, health endpoint, or
server-side persistence boundary. Entra authentication is not applicable.

Response policy includes a self-only CSP except the explicit Sociobot API,
`frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin referrers, and a
restrictive permissions policy.

## Offline, caching, and performance

The service worker became active and controlling at `/sw.js`; `update()` was
invoked against the live URL without error. With browser networking and HTTP
cache then disabled, `/demo` reloaded with its title, H1, sample banner, and
service-worker control intact. Cache name was `wsb-site-v4`.

HTML and `sw.js` use `max-age=30, must-revalidate`. Hashed JS/CSS use
`max-age=31536000, immutable`; the hero uses a one-week cache. Production
sizes are 18,485 B JS (6.58 kB gzip), 11,624 B CSS (3.32 kB gzip), 102,036 B
total fonts, and 79,942 B hero WebP. All supplied budgets pass.

Fresh mobile Lighthouse: performance 98, accessibility 100, best practices
100, SEO 100; FCP 1.053 s, LCP 1.803 s, TBT 155 ms, CLS 0. A policy-generation
interaction reached the second animation frame in 14.3 ms in the live browser.

## Defects by severity

- **Critical:** none.
- **High:** none.
- **Medium:** none.
- **Low:** none.

## Verification limitations

No real OS keychain, 1Password account, or valid paid license was available.
Those boundaries were exercised with hermetic provider doubles and recorded
valid/invalid Sociobot responses in the passing suite; the live invalid-token
path and hosted checkout redirect were tested directly. macOS received a
cross-compilation check plus its provider-command unit contract, not a macOS
runtime test.
