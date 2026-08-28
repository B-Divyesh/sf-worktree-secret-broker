# Handoff — Worktree Secret Broker repair 1

## Release status

**PASS for the shipped CLI and static site.** The repair was built from verifier
commit `e47470de215b99113c5c2fa5cb347916048d2584`; the repaired product was
committed at `9ec90e243ff56010b208fcb7df03acf2398eb00d` and the deployed tree at
`c5ebcd5f7df821e485c55dcda7cbbe4eb7acf855`.

The final production deployment is live at
<https://worktree-secret-broker.sociobot.in>. Azure Static Web Apps deployment
`77b94ce0-1039-406e-b4d0-ca0be457247d` completed successfully on 2026-08-28.

## Verifier findings repaired

### Dead paid checkout

The finding reproduced: the public Sociobot catalog has no
`worktree-secret-broker` entry and the advertised checkout returned HTTP 404.
Repository policy forbids changing billing infrastructure from this product
repository. The site therefore no longer advertises a purchase, accepts a
license, or permits the removed API origin in CSP.

The working names-only policy generator was preserved as a free, local browser
helper. A regression now asserts that no checkout link, buy action, or `$19`
offer is rendered. Production source and HTML contain no checkout reference.

### Incomplete claim inventory

Ambiguous claims such as “Values stay in your keychain”, “No secret files”,
“local-only”, “no telemetry”, and “The value does not appear in the command
line” were removed or narrowed. `.factory/claims.json` now contains ten
observable claims, each with exactly one matching `@claim:<id>` test:

- `demo-isolated`
- `approved-environment`
- `names-only-receipt`
- `production-denied`
- `lease-expiry`
- `worktree-root-required`
- `demo-same-origin`
- `recorded-demo-sample`
- `site-no-analytics`
- `policy-generator`

The landing copy audit was updated. The three first-screen facts now map to
tested child-environment, names-only receipt, and production-denial behavior.

## Additional hardening

- `npm test` now runs `cargo clippy -D warnings` and TypeScript checking.
- Playwright tests run against the production build, not Vite development mode.
- Service-worker testing works on localhost and verifies a controlled offline
  reload. Cache version `wsb-site-v2` replaces the prior shell on update.
- The production CSP is self-only; the removed licensing origin is no longer
  allowed.
- Vite was updated from 7.1.3 to 7.3.6. `npm audit` now reports zero known
  vulnerabilities.
- The stale `www.sociobot.in` footer link was changed to the valid apex host.

## Verification evidence

Commands completed successfully from this checkout:

```sh
npm ci
npm audit --audit-level=high
npm test
npm run build
cargo package --allow-dirty
```

- Clean install: 24 packages; audit: 0 vulnerabilities.
- Rust: formatting, clippy with warnings denied, 4 unit tests, and doc tests
  pass.
- TypeScript: `tsc --noEmit` passes.
- Browser: all 19 Playwright tests pass, including all ten claim tests.
- Every claim command in `.factory/claims.json` was also run separately and
  passed with one selected tagged test.
- Build: `dist/site/` and `dist/bin/wsb` produced successfully. The binary is
  1,032,912 bytes.
- Package: `target/package/worktree-secret-broker-0.1.0.crate` built and was
  installed with `--locked` into a fresh temporary consumer. Installed
  `wsb --help`, `wsb init`, and `wsb demo --json` passed. The generated config
  returned exit 1 with the expected missing-provider recovery message.
- URL verifier: title, `lang=en`, one `h1`, `main`, image alternatives, button
  labels, and console checks pass.
- Axe: zero serious or critical findings on `/`, `/demo`, `/privacy`, `/terms`,
  and the designed missing route, locally and live.
- Mobile: 390×844 has no horizontal overflow. The primary action is 350×50 px.
- Keyboard: focus starts on the skip link; the policy helper submits with
  Enter; demo controls are native buttons and links with visible focus.
- Privacy: the landing, demo, and local policy flow make same-origin requests
  only. No analytics or third-party runtime asset was observed.
- Offline/update: a fresh live context installs `wsb-site-v2`, becomes
  controlled, updates the registration, and reloads `/demo` offline.
- Link crawl: every local navigation and `https://sociobot.in/` returned 200.
- Response policy: live CSP is self-only and includes `frame-ancestors 'none'`;
  HSTS, `nosniff`, strict-origin referrer policy, and restrictive permissions
  policy are present. Hashed assets retain immutable caching.
- Live identity: local and deployed SHA-256 values match for `index.html`
  (`f9501402…eb76`), JavaScript (`4ecc490c…230d`), CSS
  (`7367d780…b0b`), and `sw.js` (`8c3d179f…f6b`).

Lighthouse 13 mobile results are stored in `.factory/lighthouse.json`:

- Performance: 99
- Accessibility: 100
- Best practices: 100
- SEO: 100
- LCP: 1.96 seconds
- TBT: 0 ms
- CLS: 0

Initial assets remain under budget: JavaScript 4.76 KB gzip, CSS 3.19 KB gzip,
fonts 102,036 bytes, and hero WebP 79,942 bytes.

## Run, package, and deploy

```sh
npm ci
npm test
npm run build
cargo package --allow-dirty
/opt/fleet/lib/deploy-static.sh worktree-secret-broker dist/site
```

## Known gaps

- One-time monetization is deferred until the factory registers a real
  Sociobot/Dodo product. No unavailable purchase is shown in the meantime.
- Native keychain integration covers macOS and Linux. Windows users need the
  1Password CLI until a Credential Manager provider is added.
- Provider integration tests use local command shims because this worker has
  no signed-in OS keychain or 1Password account.
- Registry publishing and signed cross-platform binaries remain factory release
  tasks; no package was published from this worker.
