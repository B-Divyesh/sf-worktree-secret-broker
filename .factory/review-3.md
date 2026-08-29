# Adversarial first-read review 3 — Worktree Secret Broker

**Verdict: FAIL.** Reviewed 2026-08-29 UTC against commit `687e18f7a2f8a9406e58e60d8c90137d6f137241` and the deployed site at <https://worktree-secret-broker.sociobot.in>.

The core CLI and one-click sample are clear and work. This is not a pass: the site makes unlisted, untested claims about the paid-license token and about payment/refunds.

## Cold first read

Fresh browser contexts, with no prior storage, opened `/` before scrolling at 390 × 844 and 1440 × 900.

| Question | Answer visible before scrolling |
| --- | --- |
| What does it do? | “Lease secrets to one worktree process.” The supporting sentence makes this concrete: each worktree receives only approved development variables. |
| For whom? | “For developers running coding agents…” |
| What should I click first? | “Try it with sample data”; the adjacent text says “Opens an isolated recorded CLI run.” |

This mandatory gate passes. At 390 px the action was visible, client and scroll widths were both 390 px, and normal routes had no console or page error. The dusk/key-orchard illustration, editorial type, clipped coral action, and terminal recording match `.factory/design.md` and are not a generic SaaS template.

## Findings

### F-3-1 — BLOCKING — paid-license privacy assertions are unlisted and not proved by an outgoing-request test

**Exact text and locations:**

- Landing license form: “The token stays in this browser and goes only to Sociobot for verification.”
- Privacy H1: “Privacy stays local.”
- Privacy page: “The site stores a license only after you paste one or return from checkout. It sends that token only to Sociobot for verification.”
- README Privacy: “The site sends a stored license only to Sociobot for verification.”

`claims.json` has no license-data/privacy claim. `paid-team-review` tests a mocked expected Sociobot verification request, local caching, and UI states; it does not record *all* requests through the license flow and assert permitted origins. It therefore cannot establish “only to Sociobot.” “Privacy stays local” is also over-broad because the page says a license token is sent to Sociobot.

**Why this fails:** a buyer deciding whether to paste a purchase token is asked to rely on a privacy boundary with no listed observable test, while the headline hides its stated exception.

**Concrete fix:** add `license-token-privacy` with a tagged clean-browser test. Record all requests through returned license, paste-and-verify, cache restore, and invalidation; allow only the site origin and the exact Sociobot verification origin after explicit verification. Assert that no token remains in the URL and that demo mode never reads or writes the license key. Change the H1 to “How license checks handle data” and the form copy to: “The site stores your license in this browser and sends it to Sociobot when it checks it.”

### F-3-2 — BLOCKING — merchant, refund, and refund-revocation promises have no claim or sandbox proof

**Exact text and locations:**

- Landing license status: “Sociobot and Dodo are the merchant of record. Refunds are handled there.”
- README Team review tools: “Sociobot and Dodo are the merchant of record. Refunds are handled there.”
- Terms Purchases: “Sociobot and Dodo are the merchant of record. A refund revokes its license.”

None has a `claims.json` entry. The current `paid-team-review` fixture can model an invalid license response, but cannot prove who is merchant of record, who handles refunds, or that a real refund changes a real license. The live checkout endpoint redirected to Dodo, which does not establish those stronger assertions.

**Why this fails:** payment and refund statements are visitor-reliant legal claims. The claims contract requires an observable sandbox test or removal.

**Concrete fix:** remove merchant/refund and refund-revocation assertions unless the product can cite and test an authoritative owned billing contract. Keep only the testable statement: “Team review tools cost $19 once. License checks use Sociobot.” If a real refund event is available through the Sociobot API, add a recorded fixture proving that the returned license becomes invalid; that still does not substantiate merchant/refund policy statements.

### F-3-3 — MINOR — the first-screen headline leads with unexplained security jargon

**Exact text and location:** landing H1, “Lease secrets to one worktree process.”

“Lease” is a product/security term rather than the user action. The following sentence salvages the meaning, so the cold-first-read gate passes, but the H1 is less direct than the brief’s job statement.

**Concrete fix:** replace it with “Give one worktree process approved variables.” It is seven words, names the result, and does not require a visitor to infer “secret lease.”

### F-3-4 — MINOR — the paid-section H2 does not name the section in a heading list

**Exact text and location:** landing paid-section H2, “Add a repeatable review step.”

Out of context, this could describe any product. It does not identify the paid output, while the later H3 does: “Team review checklist.”

**Concrete fix:** change the H2 to “Team policy review checklist” and retain the sentence that explains the one-time $19 purchase.

## Copy audit

Counts split on spaces. Hyphenated terms and code identifiers count as one word. Commands, paths, configuration fields, dates, and receipt key/value records are not prose sentences. Sentence-like terminal status lines are included. No sentence exceeds 22 words. Flags are F-3-1 through F-3-4; otherwise the wording uses `worktree`, `approved variable`, `provider`, and `receipt` consistently and contains no banned marketing term.

### Landing sentences and status copy

| Words | Sentence or status | Result |
| ---: | --- | --- |
| 12 | For developers running coding agents, each worktree gets only approved development variables. | Pass |
| 6 | Opens an isolated recorded CLI run. | Pass |
| 5 | The site has no analytics. | `site-no-analytics` |
| 8 | The demo reloads offline after your first visit. | `offline-demo` |
| 2 | Free CLI. | `paid-team-review` |
| 6 | Team review tools cost $19 once. | `paid-team-review` |
| 9 | Only approved variables reach the named worktree process. | `approved-environment` |
| 8 | The recording uses the demo’s two bundled names. | `recorded-demo-sample` |
| 6 | Demo — sample data, nothing is saved. | `demo-isolated`, `demo-browser-isolation` |
| 6 | ✓ child received 2 approved variable names. | `approved-environment` |
| 3 | Temporary worktree removed. | `demo-isolated` |
| 10 | Point each variable name at Keychain, Secret Service, or 1Password. | `os-keychain-provider`, `one-password-provider` |
| 11 | The broker checks the Git root before starting one child process. | `worktree-root-required` |
| 4 | Expiry stops the child. | `lease-expiry` |
| 7 | The receipt lists names, timing, and outcome. | `recorded-demo-receipt` |
| 10 | It starts children only from a named Git worktree root. | `worktree-root-required` |
| 10 | It sends only approved values into a cleared child environment. | `approved-environment` |
| 6 | It denies production-labelled entries by default. | `production-denied` |
| 10 | It cannot hide variables from the child that needs them. | Product limit |
| 3 | Enter variable names. | Pass |
| 9 | The helper creates development-only provider references in this browser. | `policy-generator` |
| 6 | Your names-only config will appear here. | Empty state |
| 8 | Pay once for a reusable policy review checklist. | `paid-team-review` |
| 6 | Every CLI safety feature stays free. | `paid-team-review` |
| 12 | The token stays in this browser and goes only to Sociobot for verification. | F-3-1 |
| 8 | Sociobot and Dodo are the merchant of record. | F-3-2 |
| 4 | Refunds are handled there. | F-3-2 |
| 14 | Create a checklist from the free policy helper’s current names, provider, and lease length. | `paid-team-review` |
| 6 | Your review checklist will appear here. | Empty state |
| 6 | Temporary secret leases for worktree processes. | Footer one-liner |

### Landing headings, labels, and actions

| Words | Text | Result |
| ---: | --- | --- |
| 3 | Local CLI · v0.1.0 | Context label |
| 6 | Lease secrets to one worktree process | F-3-3 |
| 6 | Try it with sample data | Result-naming action |
| 3 | Sample names-only receipt | Clear section label |
| 6 | The receipt shows names, never values | Clear heading |
| 3 | How it works | Clear section label |
| 7 | Run one worktree process in three steps | Clear heading |
| 3 | Map approved names | Clear step heading |
| 3 | Name the worktree | Clear step heading |
| 3 | Read the receipt | Clear step heading |
| 3 | Copy install command | Result-naming action |
| 1 | Limits | Clear section label |
| 6 | What the broker does not do | Clear heading |
| 3 | Local policy helper | Clear section label |
| 5 | Generate a names-only team policy | Clear heading |
| 3 | Generate team policy | Result-naming action |
| 3 | Optional team tools | Clear section label |
| 5 | Add a repeatable review step | F-3-4 |
| 4 | Buy team review tools | Result-naming action |
| 5 | Have a license? Paste it | Clear label |
| 2 | Verify license | Result-naming action |
| 3 | Team review checklist | Clear heading |
| 3 | Create review checklist | Result-naming action |

### README sentences

| Words | Sentence | Result |
| ---: | --- | --- |
| 10 | Give one worktree process only the development secrets it needs. | Clear summary |
| 12 | The broker reads approved values from your OS keychain or 1Password CLI. | `os-keychain-provider`, `one-password-provider` |
| 8 | It never writes those values to the worktree. | `names-only-receipt` |
| 11 | This is for developers who create disposable worktrees for coding agents. | Clear audience |
| 5 | Version 0.1.0 is MIT licensed. | Repository license |
| 13 | Install the single binary from its public source with Rust 1.85 or newer. | `public-source-install` |
| 12 | The source repository also supports `cargo install --path .` after cloning it. | `public-source-install` |
| 11 | The factory can prepare the release package with `cargo package --allow-dirty`. | Build instruction |
| 7 | Registry publishing is handled outside this repository. | Scope note |
| 12 | The command creates a temporary sample worktree and uses in-memory sample values. | `demo-isolated` |
| 11 | It prints a names-only receipt and deletes the directory when done. | `demo-isolated`, `names-only-receipt` |
| 13 | It does not read a keychain, contact a network, or save sample data. | `demo-isolated` |
| 7 | Open the browser sample directly at the displayed URL. | Clear action |
| 9 | Create `.wsb.toml` outside the worktree, then edit its references. | Clear action |
| 10 | Start exactly one child process in a named Git worktree. | `worktree-root-required` |
| 13 | `wsb` resolves each approved reference and passes the value in the child environment. | `approved-environment` |
| 4 | Lease expiry stops the child process. | `lease-expiry` |
| 6 | Stopping the broker also stops it. | `broker-stop-revokes` |
| 7 | Each run then prints a names-only receipt. | `names-only-receipt` |
| 17 | If its parent dies unexpectedly, a lease supervisor revokes the group and prints a names-only `broker-parent-died` receipt. | `broker-stop-revokes` |
| 14 | `keychain://SERVICE/ACCOUNT` calls Secret Service through `secret-tool` on Linux and Keychain through `security` on macOS. | `os-keychain-provider` |
| 10 | `op://VAULT/ITEM/FIELD` calls `op read` and uses your existing 1Password session. | `one-password-provider` |
| 14 | The config may set production labels, but `check` and `run` deny them by default. | `production-denied` |
| 9 | An operator can make the exceptional choice with `--allow-production`. | Documented override |
| 7 | Use `--json` for machine-readable checks and receipts. | `json-output` |
| 7 | The child starts with a cleared environment. | `approved-environment` |
| 15 | The broker restores a short list of shell basics such as `PATH`, `HOME`, and `TERM`. | `approved-environment` |
| 8 | Add a non-secret parent variable only when needed. | Clear action |
| 10 | Child processes and privileged local tools may read process environments. | Exposure warning |
| 18 | `wsb` narrows the set and lifetime; it cannot make environment variables invisible to the process that needs them. | Exposure warning |
| 6 | Avoid production credentials in agent worktrees. | Clear safety instruction |
| 15 | SIGINT, SIGTERM, SIGHUP, lease expiry, and broker-parent death revoke the complete child process group immediately. | `broker-stop-revokes` |
| 16 | `npm test` runs Rust tests, builds the static site, and runs browser claim and accessibility checks. | Repository instruction |
| 14 | `npm run build` creates the binary in `dist/bin/` and the deployable site in `dist/site/`. | Repository instruction |
| 11 | `npm run check:macos` is the supported macOS target compilation regression check. | Repository instruction |
| 6 | The static deploy root is `dist/site`. | Repository instruction |
| 7 | The site includes a local policy helper. | Clear capability |
| 12 | It turns variable names into development-only provider references without a network request. | `policy-generator` |
| 12 | The helper rejects duplicate names and does not ask for secret values. | `policy-helper-input-boundary` |
| 10 | The CLI and local policy helper work without a license. | `paid-team-review` |
| 13 | Team review tools cost $19 once and add a reusable policy review checklist. | `paid-team-review` |
| 15 | After checkout, the site stores the returned license in this browser and checks it with Sociobot. | F-3-1 |
| 10 | Existing buyers can paste a license on the product page. | `paid-team-review` |
| 8 | Sociobot and Dodo are the merchant of record. | F-3-2 |
| 4 | Refunds are handled there. | F-3-2 |
| 5 | The site has no analytics. | `site-no-analytics` |
| 15 | The browser demo uses bundled sample text and keeps its session state under `demo:` keys. | `demo-same-origin`, `demo-browser-isolation` |
| 11 | The site sends a stored license only to Sociobot for verification. | F-3-1 |
| 16 | The CLI only resolves the provider references in your config for the child process you start. | `approved-environment` |
| 7 | See the published privacy and terms pages. | Clear link instruction |
| 5 | Released under the MIT License. | Repository license |

## Demo, claims, and sandbox behaviour

- The hero action enters `/?demo=1` in one activation. Its first screen is already an in-use CLI recording with realistic `DATABASE_URL` and `NPM_TOKEN` names, a completed receipt, a persistent “Demo — sample data, nothing is saved to your real data” banner, Reset demo, and Start for real.
- A fresh live context was seeded with `real:review3` keys in session and local storage. Demo entry and Reset retained those keys and used only `demo:session`; Start for real removed that key while retaining both real sentinels. The entire flow requested only the product origin.
- `wsb demo --json` is covered by the declared isolated-demo test. It uses the bundled names and reports a removed temporary worktree; the browser receipt shows corresponding names, times, outcome, and revocation fields.
- All 22 exact `claims.json` commands passed independently from a fresh clone at `/tmp/wsb-review3-clean.MjgQYS/repo`; its final Playwright result is `passed` with no failed tests. F-3-1 and F-3-2 are missing claims, not failures of declared commands.

## Earlier findings and structure

I read every earlier `review-*.md`, `polish-*.md`, and the previous handoff. All earlier findings are fixed in current live behavior and source:

| Earlier finding | Confirmation |
| --- | --- |
| F-1-1 | Direct demo entry, isolated `demo:` storage, Reset/exit cleanup, and full browser/CLI receipt comparison are present and tested. |
| F-1-2 | Home, demo, privacy, terms, and 404 have route-specific title, description, canonical, Open Graph, and Twitter metadata. |
| F-1-3 | Hero caption now says “Only approved variables reach the named worktree process.” |
| F-1-4 | Preview label is “Sample names-only receipt.” |
| F-1-5 | Process heading is “Run one worktree process in three steps.” |
| F-1-6 | Demo H1 is “See the CLI run with sample worktree data.” |
| F-2-1 | `os-keychain-provider` has its own declared tagged test, including Linux and macOS command contracts. |
| F-2-2 | `policy-helper-input-boundary` tests duplicate rejection and absence of secret-value controls. |
| F-2-3 | The former 23-word README sentence is split into three short sentences. |
| F-2-4 | The former “A narrow tool” label is now “Limits.” |

Live `/`, `/demo`, `/privacy`, `/terms`, and unknown paths had correct route-specific titles, one H1, description, canonical, Open Graph/Twitter title, favicon, and main landmark. `/missing-review3` returned the designed HTTP 404. Internal links, source, checkout, factory, and mail links were checked; navigable links returned 200. The response CSP is an HTTP header with `frame-ancestors 'none'`. The existing accessibility suite covers Axe serious/critical results, keyboard, focus, reduced motion, and 200% text.

The brief calls for a deterministic local CLI security boundary. AI, sync, and import would not make that job safer; the useful companion workflow, a local names-only policy generator, exists. No decorative AI feature or embedded provider key was found.

## What would make this perfect

Test and state the paid-license data boundary exactly, or narrow the copy to what can be proven. Remove unprovable merchant/refund claims, use a plain job headline, and name the paid checklist section directly. Then rerun the fresh-clone claim matrix, live privacy request log, and all route checks. Only then can the verdict be PASS.
