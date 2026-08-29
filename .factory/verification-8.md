# Independent verification 8 — Worktree Secret Broker

**Verdict: PASS.** Candidate `d8d2e3ef755c520934d4f6885c3e19db664d96ef`
meets the supplied acceptance contract. Verified independently on 2026-08-29
UTC from a clean checkout at the candidate commit. Live URL:
<https://worktree-secret-broker.sociobot.in>.

Product source was not modified during this verification. This report and the
handoff are the only repository changes.

## Mandatory first read and demo

Cold-loading the live home page answered all three required questions above
the fold on desktop and 390 px mobile:

- **What:** “Lease secrets to one worktree process.”
- **For whom:** developers running coding agents in disposable worktrees.
- **First action:** **Try it with sample data**, explicitly described as an
  isolated recorded CLI run.

One click enters `/?demo=1`, which displays the populated sample, persistent
“Demo — sample data, nothing is saved to your real data” banner, **Reset
demo**, and **Start for real**. The CLI `wsb demo --json` independently emits
the same two sample names and removes its temporary worktree.

## Claim gate

`.factory/claims.json` exists with 22 unique IDs. Each has exactly one
`@claim:<id>` test and there are no orphan claim tags. After `npm ci` (24
packages, zero audit vulnerabilities), I invoked every exact `test` command
listed in the manifest separately. All completed successfully. The succeeding
full Playwright run exercised all 36 tests, including every 22 claim tests.

The passing claim IDs are: `demo-isolated`, `approved-environment`,
`names-only-receipt`, `production-denied`, `lease-expiry`,
`worktree-root-required`, `demo-same-origin`, `recorded-demo-sample`,
`site-no-analytics`, `policy-generator`, `broker-stop-revokes`, `demo-reset`,
`demo-browser-isolation`, `recorded-demo-receipt`, `copy-install-command`,
`one-password-provider`, `os-keychain-provider`,
`policy-helper-input-boundary`, `public-source-install`, `json-output`,
`offline-demo`, and `paid-team-review`.

## Clean build, CLI, and package checks

| Check | Result |
| --- | --- |
| `npm ci` | PASS — lockfile install, 24 packages |
| `npm test` | PASS — Rust formatting, Clippy with warnings denied, 6 Rust unit tests, TypeScript check, production site build, and 36 Playwright tests |
| `npm run build` | PASS — `dist/site/` and `dist/bin/wsb` (1,016,776 bytes) |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run check:macos` | PASS after installing the clean container's missing `x86_64-apple-darwin` Rust target |
| `cargo package --allow-dirty --locked` | PASS — 51 files, 250.5 KiB unpacked / 71.9 KiB compressed |
| clean packed consumer | PASS — installed to a fresh temporary prefix; `wsb --version` returned `wsb 0.1.0`; `wsb demo --json` returned `DATABASE_URL` and `NPM_TOKEN` only and deleted its temporary worktree |

The CLI's normal sandbox flow works without a provider or network. The suite
also independently covers least-privilege cleared environments, Linux/macOS
keychain and 1Password contracts, malformed input, nested/non-worktree
rejection, production-label default denial, lease expiry, child exit, and
SIGINT/SIGTERM/SIGHUP/broker-parent-death revocation of child process groups.

## Live deployment, privacy, and accessibility

- The SHA-256 hashes of local candidate and live `index.html`, `sw.js`, hashed
  JavaScript, hashed CSS, hero image, and Open Graph image all matched. This
  deployment is the tested candidate, not merely a similar release.
- Cold home, demo, privacy, and terms loads made only same-origin requests;
  there were no page or console errors. The only intentional external request
  is an explicit license verification to `api.sociobot.in`.
- A live invalid-license browser flow stored the token under the documented
  namespaced key, received a structured HTTP 200 invalid verdict from
  Sociobot, kept paid tools locked, and showed an actionable inactive-license
  message. No sign-in is used.
- Live `/`, `/demo`, `/privacy`, and `/terms` return 200 with route-specific
  titles, `lang=en`, one `<h1>`, and one `<main>`. Unknown paths return the
  designed 404 with status 404. `verify-url.sh` passed both home and demo.
- Axe found zero serious or critical findings (indeed zero violations) on all
  live routes. Keyboard focus starts at the skip link and uses a visible
  3-pixel coral outline. At 390 x 844 there is no horizontal overflow; tested
  controls are at least 44 px tall. Reduced-motion mode produces no visible
  motion errors.
- A service-worker-controlled live `/demo` reloaded successfully after both
  browser network and HTTP cache were disabled, preserving the demo heading
  and banner.
- Response policy includes self-only CSP except the explicit Sociobot connect
  origin, `frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin referrers,
  and restrictive permissions. Hashed JS/CSS use one-year immutable caching;
  HTML and service worker revalidate after 30 seconds.
- Production bytes are well under budget: JavaScript 18,564 B raw / 6.67 KiB
  gzip, CSS 11,624 B raw / 3.32 KiB gzip, fonts 102,036 B total, and hero image
  79,942 B.

## Rate limit and server applicability

There is no product backend, sign-in, persistence API, health endpoint, or
AI endpoint. The one server-side product-unlock dependency was tested directly:
40 invalid-license requests from one client yielded **31 HTTP 200** responses,
then **9 HTTP 429** responses. The 429 response included `Retry-After: 3` and
`x-ratelimit-after: 3`; observed allowance was 31 requests in the test window.

## Defects by severity

None found. The initial macOS target check failed only because the disposable
container lacked the Rust standard-library target; after `rustup target add
x86_64-apple-darwin`, the exact repository check passed.
