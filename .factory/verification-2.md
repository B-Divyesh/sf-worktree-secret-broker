# Independent verification 2 — Worktree Secret Broker

**Verdict: FAIL — candidate `7289f379e9dc65036a5a4ecc8802f74ae90c1813`
is not releasable.**

- Live URL: <https://worktree-secret-broker.sociobot.in>
- Verified independently: 2026-08-28, 15:03–15:17 UTC
- Product source changed: no
- Report/evidence changes only: `.factory/verification-2.md`,
  `.factory/handoff.md`, and `.factory/qa-artifacts/`

The live static files match this candidate byte for byte. The previous
deployment-only paid-checkout failure is gone: the candidate does not advertise
an unavailable checkout. Fresh evidence below determines this verdict.

## Release-blocking findings

### High — an unapproved parent variable enters the child

The core least-privilege claim is not true for `CI`.

The README says the child starts with a cleared environment and that a parent
variable is added only when needed with:

```toml
[process]
inherit = ["CI"]
```

However, `src/lib.rs` includes `CI` in unconditional `SAFE_ENV`. In a config
with no `[process]` section, this independent check was run:

```sh
CI=qa_ci_parent wsb run --config good.toml --worktree worktree \
  -- sh -c 'test -z "$CI"'
```

It returned **exit 1**, proving the unapproved value reached the child. The
receipt still reported a normal `child-exited` lease. This contradicts both the
documented opt-in behavior and the listed `approved-environment` claim. That
claim's test uses only `UNRELATED_TOKEN`, so it misses the built-in exception.

For a product whose job is to narrow what reaches an agent process, this is a
core-boundary defect. Remove `CI` from the unconditional allowlist or document
and test every unconditional variable without claiming all parent variables
require approval.

### High — the required claim inventory remains incomplete

All ten listed claims have exactly one matching tag and pass after install, but
visitor-reliant statements/actions remain outside `.factory/claims.json`:

- README: “Stop the broker to revoke the child environment immediately.”
- Privacy page: “Reset demo returns the recording to its first frame.”
- Landing action: “Copy install command.”
- README: the broker reads from 1Password; the only provider-flow claim test
  uses a fake `secret-tool`, not an `op` provider fixture.

Manual QA confirmed signal revocation, demo reset, and clipboard copying work.
That does not satisfy the contract requiring every relied-on claim to have one
listed sandbox test. The explicit claims rule makes an unlisted claim a release
blocker.

### Medium — `check` accepts an invalid 1Password reference

With a fake installed `op` executable, this malformed config:

```toml
version = 1
[[secrets]]
name = "A"
source = "op://x"
labels = ["development"]
```

returned exit 0 and:

```json
{"valid":true,"secret_names":["A"],"providers":["1password"],"lease_minutes":15}
```

`wsb check` describes itself as validating references, but `op://x` is not the
documented `op://VAULT/ITEM/FIELD` shape and will fail only later during a real
run. Validate the reference structure during `check` and add malformed/boundary
provider-reference tests.

### Medium — the live install instruction is not actionable from the site

The landing page offers only `cargo install --path .`, with no repository,
download, or registry link. Running that copied command in a fresh directory
returned exit 101:

```text
error: `/tmp` does not contain a Cargo.toml file. --path must point to a
directory containing a Cargo.toml file.
```

The packaged crate itself installs correctly when the source archive is
already available, but a cold visitor cannot obtain that archive from the
product page. Link the source/package and provide an install command that works
from a fresh consumer.

### Medium — required mobile touch targets are too small

At 390×844, six visible links are under the required 44×44 CSS pixels:

| Link | Measured size |
| --- | ---: |
| Wordmark/home | 34×34 |
| Demo | 42×25.8 |
| Header Privacy | 49×25.8 |
| Footer Privacy | 43×21.7 |
| Footer Terms | 39×21.7 |
| Built by Param Factory | 140×21.7 |

The main demo action passes at 350×50.3. Increase the interactive hit areas,
not merely their visual glyph size.

### Medium — route HTTP and navigation behavior violate the route contract

- `GET /definitely-missing-qa` returns **HTTP 200**, not 404. The client draws
  a good not-found screen, but `staticwebapp.config.json` has no 404 response
  override.
- A cold load of `/#install` leaves `scrollY = 0` while `#install` is 1,547 px
  below the viewport. The deep link does not open its target.
- After scrolling home to 1,800 px, navigating to Demo, and going Back, home
  returns to `scrollY = 0`; the required scroll restoration is lost.

Route titles, heading focus after in-app navigation, and browser back/forward
URLs otherwise work.

## Required claims gate

The very first pre-install invocation reached the Rust checks but returned 127
at `tsc: not found`, as expected without `node_modules`. After the work order's
required `npm ci`, every exact command in `.factory/claims.json` was rerun from
the candidate checkout and passed:

| Claim | Exact command | Installed result |
| --- | --- | --- |
| `demo-isolated` | `npm test -- --grep @claim:demo-isolated` | PASS — 1 selected test |
| `approved-environment` | `npm test -- --grep @claim:approved-environment` | PASS — 1 selected test |
| `names-only-receipt` | `npm test -- --grep @claim:names-only-receipt` | PASS — 1 selected test |
| `production-denied` | `npm test -- --grep @claim:production-denied` | PASS — 1 selected test |
| `lease-expiry` | `npm test -- --grep @claim:lease-expiry` | PASS — 1 selected test |
| `worktree-root-required` | `npm test -- --grep @claim:worktree-root-required` | PASS — 1 selected test |
| `demo-same-origin` | `npm test -- --grep @claim:demo-same-origin` | PASS — 1 selected test |
| `recorded-demo-sample` | `npm test -- --grep @claim:recorded-demo-sample` | PASS — 1 selected test |
| `site-no-analytics` | `npm test -- --grep @claim:site-no-analytics` | PASS — 1 selected test |
| `policy-generator` | `npm test -- --grep @claim:policy-generator` | PASS — 1 selected test |

Source inspection found one and only one `@claim:<id>` occurrence for each of
the ten inventory entries. The incomplete-inventory and false-boundary issues
above were found independently of those green selected tests.

## Cold first-read and demo gate — PASS

A new desktop browser context opened the live home page with no stored state.
The first viewport says:

- What: **“Lease secrets to one worktree process.”**
- For whom: **“For developers running coding agents…”**
- First action: **“Try it with sample data.”**
- Adjacent consequence: **“Opens an isolated recorded CLI run.”**

One activation opens `/demo`. Its first screen is already populated with the
two bundled names and a completed receipt. The persistent banner says “Demo —
sample data, nothing is saved” and includes Reset demo and Start for real.
Reset writes only `demo:reset` to `sessionStorage`; Start for real clears it and
returns home. Screenshots:

- `.factory/qa-artifacts/live-first-read-desktop.png`
- `.factory/qa-artifacts/live-demo-after-click.png`
- `.factory/qa-artifacts/live-mobile-390.png`

## Clean install, tests, build, and package

All positive quality gates passed:

- `npm ci`: 24 packages installed; zero audit findings.
- `npm test`: 4 Rust unit tests and all 19 Playwright tests passed; doc tests
  passed with none defined.
- `npm run typecheck`: passed.
- `cargo fmt --check`: passed.
- `cargo clippy --all-targets --all-features -- -D warnings`: passed.
- `npm audit --audit-level=high`: zero vulnerabilities.
- `npm run build`: passed and produced `dist/site/` plus `dist/bin/wsb`.
- Release binary: 1,032,912 bytes.
- `cargo package --allow-dirty --locked`: passed; package size 70,582 bytes.

The `.crate` was unpacked and installed with `cargo install --locked --path`
into fresh consumer root `/tmp/wsb-consumer-MSDIiT`. The installed `wsb 0.1.0`
provided useful `--help`, ran `demo --json`, wrote a starter config, refused to
overwrite it, and gave a clear missing-`secret-tool` recovery message.

## Independent CLI behavior matrix

| Case | Result |
| --- | --- |
| Approved fake-keychain value reaches child | PASS |
| Unrelated `UNRELATED_TOKEN` is cleared | PASS |
| Receipt/config/worktree omit resolved fixture value | PASS |
| Broker and child `/proc/*/cmdline` omit resolved value | PASS |
| Production label denied by default | PASS, exit 1 |
| Explicit `--allow-production` | PASS |
| Config lease 0 rejected / 1440 accepted | PASS |
| CLI `--ttl 0` rejected | PASS |
| Nested directory rejected as worktree root | PASS |
| Child exit 23 propagated | PASS, exit 23 |
| One-second expiry | PASS, exit 124 and `lease-expired` |
| Provider failure then corrected provider | PASS recovery |
| SIGINT broker stop | PASS; child gone and `broker-stopped` receipt |
| Two simultaneous independent leases | PASS, both exit 0 |
| Parent `CI` without opt-in | **FAIL — value inherited** |
| Malformed `op://x` during `check` | **FAIL — reported valid** |

The provider fixtures are local command shims; no signed-in OS keychain or
1Password account was available or needed for the deterministic safety checks.

## Live deployment, accessibility, privacy, and policies

- Candidate identity: SHA-256 matched live for `index.html`, JS, CSS, service
  worker, both WebP images, all fonts, icons, robots, and sitemap. Example
  hashes: HTML `f9501402…eb76`, JS `4ecc490c…230d`, CSS
  `7367d780…62b0`, service worker `8c3d179f…4f6b`.
- `/`, `/demo`, `/privacy`, `/terms`, and the client not-found screen each have
  `lang=en`, one `h1`, one `main`, ordered headings, no console/page errors,
  and zero Axe serious/critical findings.
- `/opt/fleet/lib/verify-url.sh` passed when run with its required evidence
  directory: title, language, one h1, main, image alternatives, button names,
  and console checks passed. Evidence is in
  `.factory/qa-artifacts/verify-url/`.
- Keyboard starts on the skip link. Its focus ring is a visible 3 px coral
  outline. Keyboard activation of the demo focuses its h1. The policy form
  reports invalid input and recovers after correction.
- Reduced motion computes to `0.001ms` animation/transition durations and
  automatic scroll behavior.
- At 390 px there is no horizontal overflow and the main action is visible.
  A 720 px layout used as a 200%-zoom reflow check also has no overflow.
- Landing and demo traffic is same-origin only. No analytics, third-party
  script, cookie, localStorage entry, or external runtime request was observed.
- Live headers include a self-only CSP with `frame-ancestors 'none'`, HSTS,
  `nosniff`, strict-origin referrer policy, and a restrictive permissions
  policy. Hashed JS/CSS use one-year immutable caching; fonts use seven days;
  HTML and `sw.js` use 30-second revalidation.
- Service worker `wsb-site-v2` controls the page, `registration.update()`
  completes with no waiting worker for the current version, and `/demo`
  reloads offline with its heading and demo banner.
- Every rendered navigation link returned 200; the privacy `mailto:` was
  recognized as non-HTTP. The missing route's incorrect 200 is reported above.

This is a static product with no product API, unlock endpoint, or sign-in flow.
The requested API burst/rate-limit and Entra authority checks are therefore not
applicable. No AI feature is expected for this deterministic local security
boundary; adding one would increase risk without helping the job.

## Performance

Fresh Lighthouse 13.0.1 mobile results against the live URL:

- Performance 97
- Accessibility 100
- Best Practices 100
- SEO 100
- FCP 1.29 s
- LCP 1.81 s
- TBT 180 ms
- CLS 0.00004
- Total byte weight 192,139 bytes

Static budgets pass: JS is 12,501 bytes raw / 4,788 bytes gzip; CSS is 10,680
bytes raw / 3,183 bytes gzip; fonts total 102,036 bytes; hero WebP is 79,942
bytes. Lighthouse had no run warnings; lab INP was not available.

## Retest requirements

1. Make inherited variables match the documented allowlist and add a boundary
   test covering every unconditional environment key.
2. Complete `.factory/claims.json` and add exactly one demo-entry test per
   remaining visitor-reliant claim/action.
3. Reject malformed 1Password references during `check`.
4. Provide a cold-consumer install path from the live site.
5. Increase every mobile target to at least 44×44 CSS px.
6. Return a real 404 and repair cold hash navigation plus back-scroll restore.
7. Rerun all ten exact claim commands, the full suite/build/package, CLI
   boundary matrix, and the live accessibility/performance/deployment checks.
