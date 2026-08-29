# Adversarial first-read review 4 — Worktree Secret Broker

**Verdict: PASS.** Reviewed 2026-08-29 UTC against commit
45ca35ea3e5922d63cc52b10f9e9d6ffd8b3b02a and the live deployment at
https://worktree-secret-broker.sociobot.in. There are zero findings.

## Cold first read

Fresh browser contexts opened the home page before scrolling at 390 × 844 and
1440 × 1000. The required first-screen answers were clear:

| Question | Answer visible on the first screen |
| --- | --- |
| What does it do? | “Give one worktree process approved variables.” |
| For whom? | “For developers running coding agents, each worktree gets only approved development variables.” |
| What should I click first? | “Try it with sample data”; it says “Opens an isolated recorded CLI run.” |

This passes the mandatory gate. At 390 px, the action was visible and page
scroll width equalled client width (390 px). Neither viewport logged a console
error. The key-orchard art, brass rules, editorial type, clipped action, and
terminal treatment match the design thesis and are not a generic SaaS template.

## Copy audit

Counts split on spaces; hyphenated forms count as one word. Commands, URLs,
TOML, version/date fields, and terminal key/value records are not prose
sentences. Every heading and action was also checked. No sentence exceeds 22
words. No banned marketing term, inconsistent concept name, metaphor/mood
heading, or non-result-naming action was found.

### Landing sentences and status text

| Words | Copy |
| ---: | --- |
| 12 | For developers running coding agents, each worktree gets only approved development variables. |
| 6 | Opens an isolated recorded CLI run. |
| 5 | The site has no analytics. |
| 8 | The demo reloads offline after your first visit. |
| 2 | Free CLI. |
| 6 | Team review tools cost $19 once. |
| 9 | Only approved variables reach the named worktree process. |
| 6 | Demo — sample data, nothing is saved. |
| 6 | Child received 2 approved variable names. |
| 3 | Temporary worktree removed. |
| 8 | The recording uses the demo’s two bundled names. |
| 10 | Point each variable name at Keychain, Secret Service, or 1Password. |
| 11 | The broker checks the Git root before starting one child process. |
| 4 | Expiry stops the child. |
| 7 | The receipt lists names, timing, and outcome. |
| 10 | It starts children only from a named Git worktree root. |
| 10 | It sends only approved values into a cleared child environment. |
| 6 | It denies production-labelled entries by default. |
| 10 | It cannot hide variables from the child that needs them. |
| 3 | Enter variable names. |
| 9 | The helper creates development-only provider references in this browser. |
| 6 | Your names-only config will appear here. |
| 8 | Pay once for a reusable policy review checklist. |
| 6 | Every CLI safety feature stays free. |
| 16 | The site stores your license in this browser and sends it to Sociobot when it checks it. |
| 4 | License checks use Sociobot. |
| 14 | Create a checklist from the free policy helper’s current names, provider, and lease length. |
| 6 | Your review checklist will appear here. |
| 5 | Approved variables for worktree processes. |

The headings/actions are all clear and result-naming: “Give one worktree
process approved variables,” “Try it with sample data,” “Sample names-only
receipt,” “Run one worktree process in three steps,” “Map approved names,”
“Name the worktree,” “Read the receipt,” “Copy install command,” “What the
broker does not do,” “Generate a names-only team policy,” “Team policy review
checklist,” “Buy team review tools,” “Verify license,” and “Create review
checklist.”

### README sentences

| Words | Copy |
| ---: | --- |
| 6 | Give one worktree process approved development variables. |
| 12 | The broker reads approved values from your OS keychain or 1Password CLI. |
| 8 | It never writes those values to the worktree. |
| 11 | This is for developers who create disposable worktrees for coding agents. |
| 5 | Version 0.1.0 is MIT licensed. |
| 13 | Install the single binary from its public source with Rust 1.85 or newer. |
| 12 | The source repository also supports cargo install --path . after cloning it. |
| 11 | The factory can prepare the release package with cargo package --allow-dirty. |
| 7 | Registry publishing is handled outside this repository. |
| 13 | The command creates a temporary sample worktree and uses in-memory sample values. |
| 11 | It prints a names-only receipt and deletes the directory when done. |
| 13 | It does not read a keychain, contact a network, or save sample data. |
| 7 | Open the browser sample directly at the displayed URL. |
| 9 | Create .wsb.toml outside the worktree, then edit its references. |
| 10 | Start exactly one child process in a named Git worktree. |
| 13 | wsb resolves each approved reference and passes the value in the child environment. |
| 5 | Lease expiry stops the child process. |
| 6 | Stopping the broker also stops it. |
| 7 | Each run then prints a names-only receipt. |
| 17 | If its parent dies unexpectedly, a lease supervisor revokes the group and prints a names-only broker-parent-died receipt. |
| 14 | keychain://SERVICE/ACCOUNT calls Secret Service through secret-tool on Linux and Keychain through security on macOS. |
| 10 | op://VAULT/ITEM/FIELD calls op read and uses your existing 1Password session. |
| 14 | The config may set production labels, but check and run deny them by default. |
| 9 | An operator can make the exceptional choice with --allow-production. |
| 7 | Use --json for machine-readable checks and receipts. |
| 7 | The child starts with a cleared environment. |
| 15 | The broker restores a short list of shell basics such as PATH, HOME, and TERM. |
| 8 | Add a non-secret parent variable only when needed. |
| 10 | Child processes and privileged local tools may read process environments. |
| 18 | wsb narrows the set and lifetime; it cannot make environment variables invisible to the process that needs them. |
| 6 | Avoid production credentials in agent worktrees. |
| 15 | SIGINT, SIGTERM, SIGHUP, lease expiry, and broker-parent death revoke the complete child process group immediately. |
| 16 | npm test runs Rust tests, builds the static site, and runs browser claim and accessibility checks. |
| 14 | npm run build creates the binary in dist/bin/ and the deployable site in dist/site/. |
| 11 | npm run check:macos is the supported macOS target compilation regression check. |
| 6 | The static deploy root is dist/site. |
| 7 | The site includes a local policy helper. |
| 12 | It turns variable names into development-only provider references without a network request. |
| 12 | The helper rejects duplicate names and does not ask for secret values. |
| 10 | The CLI and local policy helper work without a license. |
| 13 | Team review tools cost $19 once and add a reusable policy review checklist. |
| 15 | After checkout, the site stores the returned license in this browser and checks it with Sociobot. |
| 10 | Existing buyers can paste a license on the product page. |
| 5 | The site has no analytics. |
| 15 | The browser demo uses bundled sample text and keeps its session state under demo: keys. |
| 16 | The site stores a license in this browser and sends it to Sociobot when it checks it. |
| 16 | The CLI only resolves the provider references in your config for the child process you start. |
| 7 | See the published privacy and terms pages. |
| 5 | Released under the MIT License. |

## Demo, sandbox, and claims

The first action opens the direct demo in one click. Its first screen already
shows the realistic bundled names DATABASE_URL and NPM_TOKEN, a completed
receipt, and a persistent “Demo — sample data, nothing is saved to your real
data” banner with Reset demo and Start for real.

In a fresh live context, seeded real:review4-local and real:review4-session
values were unchanged on entry, after Reset demo, and after Start for real.
Entry added only demo:session; Reset cleared an added demo:changed-frame; exit
removed all demo: keys. The full request log contained only the product origin.
This confirms browser-demo isolation, while the CLI demo claim confirms
temporary-worktree cleanup and no provider/network use.

A source-clean clone received npm ci; then every exact test command in
.factory/claims.json ran separately. **All 23 passed**:
demo-isolated, approved-environment, names-only-receipt, production-denied,
lease-expiry, worktree-root-required, demo-same-origin, recorded-demo-sample,
site-no-analytics, policy-generator, broker-stop-revokes, demo-reset,
demo-browser-isolation, recorded-demo-receipt, copy-install-command,
one-password-provider, os-keychain-provider, policy-helper-input-boundary,
public-source-install, json-output, offline-demo, paid-team-review, and
license-token-privacy. No live landing or README claim is unlisted.

## Earlier findings

Every earlier review, polish, and handoff document was read. The following are
confirmed fixed in current source and live behavior:

| Earlier finding | Confirmation |
| --- | --- |
| F-1-1 | Direct isolated demo, reset/exit cleanup, and complete browser/CLI receipt comparison exist and are tested. |
| F-1-2 | Every route has its own title, description, canonical, OG/Twitter metadata, and designed 404. |
| F-1-3–F-1-6 | Direct caption, “Sample names-only receipt,” self-contained process heading, and plain demo H1 are live. |
| F-2-1–F-2-2 | Dedicated OS-keychain and policy-input-boundary claims/tests exist. |
| F-2-3–F-2-4 | The long README sentence is split and the Limits label is informative. |
| F-3-1–F-3-2 | License-token request/storage behavior has its own test; unprovable merchant/refund copy is absent. |
| F-3-3–F-3-4 | The plain job headline and “Team policy review checklist” heading are live. |

No earlier finding is unfixed, half-fixed, or regressed.

## Structure and missed leverage

The product, demo, privacy, and terms routes returned 200; an unknown route
returned the designed HTTP 404. Every checked route had one h1, one main,
route-appropriate title/description/canonical/OG metadata, favicon, and lang.
The header/footer, skip link, focusable route change, history behavior,
Privacy/Terms links, robots file, sitemap, service worker, and response-header
CSP were present. The crawl returned success for all navigable product, GitHub,
Sociobot, factory, and checkout links; the privacy link is intentionally mailto.

The brief calls for a deterministic local secret boundary. AI, cloud sync, or
secret import would expand that trust boundary rather than supply an obvious
missing benefit. The valuable adjacent task—a local names-only policy
generator—is already provided. No decorative AI feature or provider key was
found.

## What would make this perfect

No corrective work is required in this round. Preserve the claim-to-test
mapping and rerun the clean-clone, live demo-isolation, and route checks when
the CLI, provider contract, pricing flow, or browser-storage logic changes.
