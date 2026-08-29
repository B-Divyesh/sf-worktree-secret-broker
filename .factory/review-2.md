# Adversarial first-read review 2 — Worktree Secret Broker

**Verdict: FAIL.** Reviewed 2026-08-29 UTC against repository commit
`96977d4438b907c94a680bbd467a9cf496ad6ef6` and the deployed site
<https://worktree-secret-broker.sociobot.in>.

Two documented capabilities still have no matching entry and tagged test in
`.factory/claims.json`. The landing and demo work otherwise, but the claims
contract is an acceptance gate: a visitor must not be asked to rely on a
capability that is only covered by an untagged regression test or a general
test fixture.

## Cold first read

Fresh browser contexts opened `/` without prior storage or cookies at 390 ×
844 and 1440 × 900. Before scrolling, I could answer all mandatory questions:

| Question | Answer visible on the first screen |
| --- | --- |
| What does it do? | “Lease secrets to one worktree process.” |
| For whom? | “For developers running coding agents, each worktree gets only approved development variables.” |
| What should I click first? | “Try it with sample data”; the adjacent text says “Opens an isolated recorded CLI run.” |

This gate passes. At 390 px the primary action is visible and there is no
horizontal overflow (390 px client and scroll width). Desktop and mobile
loaded without console or page errors; the request log contained only the
product origin.

## Findings

### F-2-1 — BLOCKING — the advertised OS-keychain provider support is an unlisted claim

**Exact text and locations:**

- Landing, step 1: “Point each variable name at Keychain, Secret Service, or 1Password.”
- README, Providers: “`keychain://SERVICE/ACCOUNT` calls Secret Service through `secret-tool` on Linux and Keychain through `security` on macOS.”

`claims.json` has `one-password-provider`, but no `os-keychain-provider` (or
equivalent) claim. `approved-environment` happens to use a fake
`secret-tool` as a fixture, but its declared claim is only “Only approved
values enter a cleared child environment.” It does not establish the stated
Linux Secret Service and macOS Keychain provider contract, and there is no
tagged test for the macOS `security` invocation.

**Why this fails:** a new visitor can choose a provider based on this
documentation. The claims rules require that product capability to be named in
the inventory and demonstrated by its own observable sandbox test.

**Concrete fix:** add an `os-keychain-provider` entry and `@claim` test. Test
the `secret-tool` arguments on Linux and the `security find-generic-password
-s SERVICE -a ACCOUNT -w` arguments on macOS CI, then assert that the value
reaches only the approved child environment. Alternatively, remove the
untested platform/provider promise and document only the tested provider.

### F-2-2 — BLOCKING — the policy helper’s validation and no-secret-input promises are unlisted

**Exact text and location:** README, Team policy helper: “The helper rejects
duplicate names and does not ask for secret values.”

The `policy-generator` claim only states that the helper creates
development-only references without a network request. Its tagged test checks
a valid generated reference. The duplicate-name check exists only as the
untagged test `regression: policy helper rejects duplicate variable names
before generating TOML`; no listed claim/test verifies the absence of a
secret-value input either.

**Why this fails:** these are two relied-on safety/validation properties of a
visible form. Passing an untagged regression does not meet the stated
one-claim/one-tag verification contract.

**Concrete fix:** add a `policy-helper-input-boundary` claim and tagged browser
test that submits duplicate names, asserts the actionable error and no TOML
output, asserts there is no secret-value control, and records all requests
through that flow. Or remove both promises from the README.

### F-2-3 — MINOR — one README sentence exceeds the 22-word copy limit

**Exact text and location:** README, “Configure a real worktree”: “The broker
kills the complete child process group when the lease expires or the broker
stops, then prints a receipt with names only.” (23 words.)

**Why this matters:** it joins expiry, stopping, process-group scope, and
receipt contents into one long condition. The plain-words hard cap is 22
words and the sentence is harder to scan during setup.

**Concrete fix:** replace it with: “Lease expiry stops the child process.
Stopping the broker also stops it. Each run then prints a names-only receipt.”

### F-2-4 — MINOR — a landing eyebrow carries no useful information

**Exact text and location:** landing limits section eyebrow: “A narrow tool”.

**Why this matters:** the phrase could sit above any product and does not name
the section. The useful heading below is already “What the broker does not
do.”

**Concrete fix:** remove the eyebrow or replace it with “Limits”.

## Copy audit

Counts split on spaces; hyphenated forms and code paths count as one word.
Commands, TOML blocks, URLs, form labels, and terminal field/value lines are
not prose sentences. The terminal’s complete natural-language status lines
are included below. Necessary developer terms (`worktree`, `child process`,
`provider`, and `receipt`) are used consistently and are explained by the
surrounding setup text; no marketing adjective or banned plain-words term was
found.

### Landing prose and recorded status text

| Words | Text | Result |
| ---: | --- | --- |
| 12 | For developers running coding agents, each worktree gets only approved development variables. | Pass |
| 6 | Opens an isolated recorded CLI run. | Pass |
| 6 | Only approved variables enter the child. | Pass — `approved-environment` |
| 5 | Receipts list names, never values. | Pass — `names-only-receipt` |
| 6 | Production labels are denied by default. | Pass — `production-denied` |
| 9 | Only approved variables reach the named worktree process. | Pass — `approved-environment` |
| 8 | The recording uses the demo’s two bundled names. | Pass — `recorded-demo-sample` |
| 10 | Point each variable name at Keychain, Secret Service, or 1Password. | F-2-1 |
| 11 | The broker checks the Git root before starting one child process. | Pass — `worktree-root-required` |
| 4 | Expiry stops the child. | Pass — `lease-expiry` |
| 7 | The receipt lists names, timing, and outcome. | Pass — `recorded-demo-receipt` |
| 6 | It does not host a vault. | Pass — product limit |
| 5 | It does not scan repositories. | Pass — product limit |
| 8 | It denies production-labelled entries by default. | Pass — `production-denied` |
| 10 | It cannot hide variables from the child that needs them. | Pass — exposure limit |
| 3 | Enter variable names. | Pass |
| 9 | The helper creates development-only provider references in this browser. | Pass — `policy-generator` |
| 6 | Your names-only config will appear here. | Pass — empty state |
| 6 | Demo — sample data, nothing is saved. | Pass — demo isolation |
| 4 | Temporary worktree removed. | Pass — `demo-isolated` |
| 6 | Temporary secret leases for worktree processes. | Pass — footer one-liner |

### Landing headings and actions

| Words | Text | Result |
| ---: | --- | --- |
| 3 | Local CLI · v0.1.0 | Pass |
| 6 | Lease secrets to one worktree process | Pass: job headline is under nine words |
| 6 | Try it with sample data | Pass: result-naming primary action |
| 3 | Sample names-only receipt | Pass |
| 6 | The receipt shows names, never values | Pass |
| 3 | How it works | Pass |
| 7 | Run one worktree process in three steps | Pass |
| 3 | Map approved names | Pass |
| 3 | Name the worktree | Pass |
| 3 | Read the receipt | Pass |
| 3 | Copy install command | Pass: result-naming button |
| 3 | A narrow tool | F-2-4 |
| 6 | What the broker does not do | Pass |
| 3 | Local policy helper | Pass |
| 5 | Generate a names-only team policy | Pass |
| 3 | Generate team policy | Pass: result-naming button |
| 2 | View source | Pass: result-naming link |

### README prose

| Words | Sentence | Result |
| ---: | --- | --- |
| 10 | Give one worktree process only the development secrets it needs. | Pass |
| 12 | The broker reads approved values from your OS keychain or 1Password CLI. | F-2-1 for OS keychain; 1Password is covered |
| 8 | It never writes those values to the worktree. | Pass — `names-only-receipt` |
| 11 | This is for developers who create disposable worktrees for coding agents. | Pass |
| 5 | Version 0.1.0 is MIT licensed. | Pass |
| 13 | Install the single binary from its public source with Rust 1.85 or newer. | Pass |
| 12 | The source repository also supports `cargo install --path .` after cloning it. | Pass |
| 11 | The factory can prepare the release package with `cargo package --allow-dirty`. | Pass |
| 7 | Registry publishing is handled outside this repository. | Pass |
| 12 | The command creates a temporary sample worktree and uses in-memory sample values. | Pass — `demo-isolated` |
| 11 | It prints a names-only receipt and deletes the directory when done. | Pass — `demo-isolated`, `names-only-receipt` |
| 13 | It does not read a keychain, contact a network, or save sample data. | Pass — `demo-isolated` |
| 7 | Open the browser sample directly at the displayed URL. | Pass |
| 9 | Create `.wsb.toml` outside the worktree, then edit its references. | Pass |
| 10 | Start exactly one child process in a named Git worktree. | Pass — `worktree-root-required` |
| 13 | `wsb` resolves each approved reference and passes the value in the child environment. | Pass — `approved-environment` |
| 23 | The broker kills the complete child process group when the lease expires or the broker stops, then prints a receipt with names only. | F-2-3 |
| 17 | If its parent dies unexpectedly, a lease supervisor revokes the group and prints a names-only `broker-parent-died` receipt. | Pass — `broker-stop-revokes` |
| 14 | `keychain://SERVICE/ACCOUNT` calls Secret Service through `secret-tool` on Linux and Keychain through `security` on macOS. | F-2-1 |
| 10 | `op://VAULT/ITEM/FIELD` calls `op read` and uses your existing 1Password session. | Pass — `one-password-provider` |
| 14 | The config may set production labels, but `check` and `run` deny them by default. | Pass — `production-denied` |
| 9 | An operator can make the exceptional choice with `--allow-production`. | Pass |
| 7 | Use `--json` for machine-readable checks and receipts. | Pass |
| 7 | The child starts with a cleared environment. | Pass — `approved-environment` |
| 15 | The broker restores a short list of shell basics such as `PATH`, `HOME`, and `TERM`. | Pass — `approved-environment` |
| 8 | Add a non-secret parent variable only when needed. | Pass |
| 10 | Child processes and privileged local tools may read process environments. | Pass — exposure limit |
| 18 | `wsb` narrows the set and lifetime; it cannot make environment variables invisible to the process that needs them. | Pass — exposure limit |
| 6 | Avoid production credentials in agent worktrees. | Pass |
| 15 | SIGINT, SIGTERM, SIGHUP, lease expiry, and broker-parent death revoke the complete child process group immediately. | Pass — `broker-stop-revokes` |
| 16 | `npm test` runs Rust tests, builds the static site, and runs browser claim and accessibility checks. | Pass |
| 14 | `npm run build` creates the binary in `dist/bin/` and the deployable site in `dist/site/`. | Pass |
| 11 | `npm run check:macos` is the supported macOS target compilation regression check. | Pass |
| 6 | The static deploy root is `dist/site`. | Pass |
| 7 | The site includes a local policy helper. | Pass |
| 12 | It turns variable names into development-only provider references without a network request. | Pass — `policy-generator` |
| 12 | The helper rejects duplicate names and does not ask for secret values. | F-2-2 |
| 5 | The site has no analytics. | Pass — `site-no-analytics` |
| 15 | The browser demo uses bundled sample text and keeps its session state under `demo:` keys. | Pass — `demo-same-origin`, `demo-browser-isolation` |
| 16 | The CLI only resolves the provider references in your config for the child process you start. | Pass — `approved-environment` |
| 7 | See the published privacy and terms pages. | Pass |

## Demo, sandbox, and claims

- The first-screen action opens `/?demo=1` in one activation. Its first screen
  already shows realistic `DATABASE_URL` and `NPM_TOKEN` sample input, a
  completed names-only receipt, and a persistent “Demo — sample data, nothing
  is saved to your real data” banner with Reset demo and Start for real.
- In a fresh live context, a `real:sentinel` session key was unchanged on demo
  entry and after Reset. Reset retained only `demo:session`; Start for real
  removed the demo key and kept the real sentinel. The full demo flow made
  only same-origin requests.
- `wsb demo --json` ran from a fresh temporary working directory. It returned
  `DATABASE_URL` and `NPM_TOKEN`, a names-only completed receipt, and left the
  invoking directory empty. The receipt’s reported temporary worktree no
  longer existed.
- From a fresh clone after `npm ci`, every command listed in `claims.json` was
  executed separately. All 16 passed: `demo-isolated`, `approved-environment`,
  `names-only-receipt`, `production-denied`, `lease-expiry`,
  `worktree-root-required`, `demo-same-origin`, `recorded-demo-sample`,
  `site-no-analytics`, `policy-generator`, `broker-stop-revokes`, `demo-reset`,
  `demo-browser-isolation`, `recorded-demo-receipt`, `copy-install-command`,
  and `one-password-provider`.
- The full clean-clone `npm test` passed 30/30 and `npm run build` passed,
  producing `dist/site/` and `dist/bin/`. Green listed claims do not remove
  F-2-1 or F-2-2 because those visible capabilities are absent from the claim
  inventory.

## History, structure, and scope checks

I read `.factory/review-1.md`, `.factory/polish-1.md`, all six earlier
verification reports, and the prior handoff. Every prior adversarial finding
is actually fixed in deployed code and behavior:

| Earlier finding | Confirmation |
| --- | --- |
| F-1-1 | Direct demo entry, demo-only storage, Reset/exit cleanup, and a full receipt comparison are now present and tested. |
| F-1-2 | `/`, `/demo`, `/privacy`, `/terms`, and `/missing` have distinct title, description, canonical, Open Graph, and Twitter values. |
| F-1-3 | Hero caption is now “Only approved variables reach the named worktree process.” |
| F-1-4 | Preview eyebrow is now “Sample names-only receipt.” |
| F-1-5 | Process heading is now “Run one worktree process in three steps.” |
| F-1-6 | Demo h1 is now “See the CLI run with sample worktree data.” |

The site has a distinct dusk/key-orchard editorial identity consistent with
`.factory/design.md`, rather than a generic SaaS template. The 390 px layout,
keyboard skip link, focus styling, reduced-motion path, live-region route
announcement, deep links, back-scroll restoration, self-hosted assets, and
no-third-party request policy are implemented. The live headers include a
self-only CSP with response-header `frame-ancestors 'none'`, HSTS, no-sniff,
and strict-origin referrer policy. Home, demo, privacy, terms, source,
factory, and mail links resolve correctly; the deliberate `/missing` document
returns the designed HTTP 404. Each tested route has one h1 and main landmark;
the shipped Axe suite reports no serious or critical violation.

The brief describes a deterministic local CLI boundary. AI, sync, and import
would not improve this job and would broaden secret exposure. The useful
companion workflow, a local names-only policy generator, is present; F-2-2 is
about proving its stated safety boundary, not adding AI.

## What would make this perfect

Add the two missing claims with exact tagged tests, split the 23-word setup
sentence, and remove or rename “A narrow tool.” Then rerun the clean-clone
claim matrix, full test/build, and the live storage/request/route checks. Only
then can the verdict become PASS.
