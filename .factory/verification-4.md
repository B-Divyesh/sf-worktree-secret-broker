# Independent verification 4 — Worktree Secret Broker

**Verdict: FAIL. Candidate `930ba0c68b085d57b7f4e3418bc799a59e31228e` is not releasable.**

- Verified independently on 2026-08-29 UTC
- Live URL: <https://worktree-secret-broker.sociobot.in>
- Product code changed during verification: **no**
- Release blocker: terminating the broker with ordinary Unix termination signals leaves the secret-bearing child alive beyond its lease and emits no revocation receipt.

## Release-blocking finding

### High — A lease survives broker termination

Sending `SIGTERM` or `SIGHUP` terminates `wsb` but leaves its child process
group running.

Independent reproduction used the release binary, a temporary Git worktree,
a fake local `secret-tool`, and a one-second lease:

1. Start `wsb run --ttl-seconds 1 ... -- sh -c '...; exec sleep 30'`.
2. Confirm `/proc/<child>/environ` contains the fake `API_TOKEN`.
3. Send `SIGTERM` to the broker and wait more than three seconds.
4. The broker exits with `signal: SIGTERM`, but the child remains non-zombie
   and still has `API_TOKEN` after the one-second lease deadline.
5. Broker stdout is empty: no `broker-stopped` or revocation receipt is
   produced. `SIGHUP` has the same result.

The control run with `SIGINT` kills the child and emits a names-only receipt
with `outcome: broker-stopped`. The verifier then killed every surviving fake
child during cleanup.

This contradicts the declared `broker-stop-revokes` claim (“Stopping the
broker kills the leased child process and records broker-stopped”), the README
promise “Stop the broker to revoke the child environment immediately,” and
the product's short-lived lease contract. The claim test covers only SIGINT,
so it passes while the broader published claim is false. Evidence:
`qa-artifacts/verification-4/cli-adversarial-result.json`.

Expected repair: handle `SIGTERM` and `SIGHUP`, and arrange for the child
process group to die if the broker exits unexpectedly, so a lease cannot
outlive its broker. Add claim tests for these paths and for expiry after broker
death.

## Other finding

### Medium — The policy helper emits an invalid config for duplicate names

Entering `TOKEN TOKEN` and choosing **Generate team policy** produces two
identical `[[secrets]]` blocks without an error. Passing that generated text to
the release CLI exits 1 with:

```text
error: TOKEN is approved more than once. Keep one entry
```

Empty and malformed names are handled and recover correctly. The duplicate
case should either be rejected with the same actionable message or be
deduplicated. Evidence: `policy-helper-boundaries.json` and
`policy-helper-validation.json` in the verification-4 artifact directory.

## Mandatory first checks

### Claims

The checkout began clean at the exact candidate. After the required `npm ci`
bootstrap, every command in `.factory/claims.json` was run separately and all
16 declared tests passed through the bundled CLI/browser demo fixtures.

| Claim ID | Exact command result |
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
| `broker-stop-revokes` | PASS for its tested SIGINT case; contradicted by SIGTERM/SIGHUP QA above |
| `demo-reset` | PASS |
| `demo-browser-isolation` | PASS |
| `recorded-demo-receipt` | PASS |
| `copy-install-command` | PASS |
| `one-password-provider` | PASS |

Each ID appears exactly once as `@claim:<id>` in the test source, with no
unlisted test tags or duplicate claim IDs. Full command output is in
`qa-artifacts/verification-4/claims.log`.

### Cold first-read and one-click demo

This gate passes on desktop and 390 px mobile:

- What it does: “Lease secrets to one worktree process.”
- For whom: “For developers running coding agents...”
- First click: “Try it with sample data,” followed by “Opens an isolated
  recorded CLI run.”

One click opens `/?demo=1`, immediately showing the bundled names and receipt.
The persistent banner says “Demo — sample data, nothing is saved to your real
data” and includes **Reset demo** and **Start for real**. Screenshots:
`live-cold-desktop.png` and `live-mobile-390.png`.

## Clean build and package verification

The following passed from the candidate checkout:

```sh
npm ci
npm test
npm run typecheck
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
npm audit --audit-level=high
npm run build
cargo package --allow-dirty --locked
```

- `npm test`: 5 Rust unit tests and 29 Playwright tests passed.
- `npm audit`: 0 vulnerabilities.
- The exact production build created `dist/site/` and `dist/bin/wsb`.
- Release binary: 1,034,048 bytes.
- Crate: 51 files, 239.9 KiB unpacked / 69.5 KiB compressed.
- Site JavaScript: 13,712 bytes / 5.08 KiB gzip.
- CSS: 10,945 bytes / 3.23 KiB gzip.
- Fonts total 102,036 bytes; hero image 79,942 bytes. All budgets pass.

The public README command was also run in a clean install root:

```sh
cargo install --git https://github.com/B-Divyesh/sf-worktree-secret-broker.git --locked
```

Cargo installed source commit `930ba0c6`; the installed `wsb 0.1.0` returned
help and completed `wsb demo --json`. A separate path-installed consumer
binary was byte-identical to `dist/bin/wsb`.

## Independent CLI coverage

Aside from the termination defect, independent release-binary checks passed:

- normal keychain-reference resolution and names-only JSON receipt;
- lease boundaries 1 and 1,440 minutes, with 0 and 1,441 rejected;
- case-insensitive production denial and explicit override;
- invalid environment name, nested worktree, and missing command rejection;
- provider failure followed by successful correction;
- child exit code 37 propagated in both process status and receipt;
- `init` refuses to overwrite an existing config;
- fake secret absent from broker and child command lines;
- fake secret present only in the intended child environment;
- `SIGINT` revokes the child and records `broker-stopped`.

The product tests additionally cover missing providers, malformed 1Password
references, explicit environment inheritance, one-second expiry, Git diff
secrecy, demo cleanup, and provider/network traps.

## Live deployment and browser QA

- Candidate match: every deployable file fetched from the live site is
  byte-for-byte identical to the local production build. The only local file
  not served is `staticwebapp.config.json`, which Azure consumes as deployment
  configuration. The public Git install also resolved to the candidate commit.
- Routes: `/`, `/demo`, `/privacy`, and `/terms` return 200. An unknown path
  returns the designed page with HTTP 404. The 404 document generates the
  browser's expected failed-document console entry; normal routes have zero
  console or page errors.
- Privacy: the complete landing, demo/reset/exit, and policy-helper flow made
  only same-origin requests. There were no cookies, third-party requests,
  analytics calls, request failures, or residual local/session storage.
- Security headers: self-only CSP, `frame-ancestors 'none'`, HSTS, `nosniff`,
  strict-origin referrer policy, and restrictive camera/microphone/geolocation
  policy are present.
- Caching: HTML and `sw.js` revalidate after 30 seconds; hashed JS/CSS are
  immutable for one year; an ETag conditional asset request returned 304.
- Accessibility: Axe found zero serious/critical findings on all five routes.
  Each page has `lang=en`, one `h1`, and a `main`; images have alt text and
  buttons have names. The factory `verify-url.sh` passes home and demo.
- Keyboard: first Tab reaches the skip link with a 3 px coral focus ring;
  activating it makes the next Tab land on the first main action. The policy
  helper operates by keyboard, announces output, reports malformed input, and
  recovers after correction.
- Mobile: at 390×844 the primary action is in the first screen, there is no
  horizontal overflow, and all 14 visible interactive controls measure at
  least 44×44 CSS pixels.
- Reduced motion: the media query matches, no animation remains running,
  durations reduce to 0.001 ms, and scroll behavior becomes instant.
- Service worker: it controlled `/demo`, `registration.update()` produced no
  stale waiting worker, and the demo reloaded successfully offline.
- Links: all intended internal and external links returned 200. The only 404
  in the crawl is the deliberate current URL of the designed not-found page.

Fresh mobile Lighthouse results:

| Category / metric | Result |
| --- | ---: |
| Performance | 94 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| First Contentful Paint | 1.4 s |
| Largest Contentful Paint | 1.8 s |
| Total Blocking Time | 270 ms |
| Cumulative Layout Shift | 0 |
| Total transfer | 188 KiB |

Full evidence is under `.factory/qa-artifacts/verification-4/`.

## Applicability notes

This is a local Rust CLI with a static companion site. It has no backend,
server-side product endpoint, sign-in, AI runtime, paid checkout, analytics,
or persistence service. API concurrency, persistence boundaries, health/build
identity, Entra authority, and endpoint allowance/429 checks are therefore not
applicable. The tool's deterministic security job does not need an AI feature.

The previously reported deployment concern is resolved: fresh byte comparison
shows the live deployment matches the candidate's product build. The candidate
still fails because of the independently reproduced lease/revocation defect.
