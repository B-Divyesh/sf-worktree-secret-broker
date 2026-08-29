# Adversarial first-read review 1 — Worktree Secret Broker

**Verdict: FAIL.** Reviewed 2026-08-29 UTC against commit
`d4b251e1f19851b8b619a9363ecec92b6c982f34` and the deployed site
`https://worktree-secret-broker.sociobot.in`.

The core job is real and the first interaction works. This is not a pass
because the displayed claim inventory is still incomplete, several headings
use non-informative imagery, and non-home routes retain home-page social
metadata.

## Cold first read

Fresh browser contexts at 390 x 844 and 1440 x 900 were opened at `/` before
scrolling. The first viewport makes the following clear:

| Question | Answer from the screen |
| --- | --- |
| What does it do? | “Lease secrets to one worktree process.” |
| For whom? | “For developers running coding agents…” |
| What should I click first? | “Try it with sample data”; it says it “Opens an isolated recorded CLI run.” |

This mandatory gate passes. The 390 px viewport has no horizontal overflow;
the action is visible and 350 x 51 CSS px. The illustrated key mark, night
palette, editorial type, and clipped coral action are distinct from a generic
SaaS template and match the recorded design thesis.

## Findings

### F-1-1 — BLOCKING — displayed demo/receipt assertions are not individually claimed and tested

**Locations and exact text:**

- Demo banner and recorded output: “Demo — sample data, nothing is saved”.
- Demo note: “This recording matches `wsb demo`.”
- Landing step 3: “The receipt lists names, timing, and outcome.”

`claims.json` has tests for CLI-demo isolation, the two recorded names, and
resetting a deliberately added `demo:` session key. It has no entry that
proves the browser banner’s “nothing is saved” promise, no test that the full
recording matches the command, and no test for the timing/outcome fields. The
existing `recorded-demo-sample` test compares only `DATABASE_URL` and
`NPM_TOKEN`; it cannot establish the broader “matches” assertion. These are
visitor-reliant statements and the claims contract requires one listed,
observable sandbox test for each.

**Why this fails first-read honesty:** the demo presents these as safety and
fidelity guarantees. A visitor cannot tell which parts are verified.

**Concrete fix:** either narrow the copy to exactly the proven assertion, or
add separate, exact claims and tagged tests. In particular, enter `/demo`
from a fresh context with a sentinel non-demo storage key; assert that only
`demo:` storage changes through Reset and Start for real. Run `wsb demo
--json` and compare every displayed receipt field and the removal result, not
just the two names. Assert the displayed receipt schema includes and matches
`names`, `started`, `expires`, and `outcome`.

### F-1-2 — MINOR — route-specific social metadata remains the home page

**Location:** direct rendered `/demo`, `/privacy`, `/terms`, and unknown-path
routes.

**Evidence:** after each route renders, its document title and canonical URL
are correct, but `meta[property="og:title"]` remains “Worktree Secret Broker
— Lease development secrets”. `/privacy` and the 404 route also retain the
home description: “Give one worktree process only the development secrets it
needs, without copying a secret file.”

**Why this matters:** a shared Privacy, Demo, or not-found URL is described as
the product home, not the page the recipient opens. This misses the required
per-route metadata contract.

**Concrete fix:** keep a metadata map per route and update description,
OpenGraph title/description, and Twitter title/description on navigation. For
non-JavaScript crawlers, emit route-specific HTML (or prerendered equivalents)
instead of relying only on SPA mutation.

### F-1-3 — MINOR — the hero figure caption uses a metaphor instead of the product action

**Location:** home hero figcaption: “Only named keys reach the temporary root
chamber.”

**Why this fails plain words:** “keys” and “root chamber” are image lore, not
the thing a visitor configures. It adds no usable instruction and makes the
security boundary less direct.

**Concrete fix:** replace it with: “Only approved variables reach the named
worktree process.”

### F-1-4 — MINOR — a section label is a mood phrase

**Location:** home preview eyebrow: “See the boundary”.

**Why this fails plain words:** it does not name what the section contains
when read out of context.

**Concrete fix:** replace it with “Sample names-only receipt”.

### F-1-5 — MINOR — the process heading is not self-explanatory out of context

**Location:** home “How it works” heading: “Approve, run, revoke”.

**Why this fails plain words:** three bare verbs do not identify the object or
outcome of the section for a screen-reader heading list or a cold visitor.

**Concrete fix:** replace it with “Run one worktree process in three steps”.

### F-1-6 — MINOR — the demo headline uses an unexplained product metaphor

**Location:** `/demo` h1: “Watch a secret lease finish cleanly”.

**Why this fails plain words:** “secret lease” is product vocabulary, while
“finish cleanly” does not name the observable result. The visitor has to infer
that they are seeing a CLI run in a temporary worktree.

**Concrete fix:** replace it with “See the CLI run with sample worktree data”.

## Copy audit

Counts split on spaces; hyphenated terms count as one word. Commands,
configuration, paths, timestamps, and the literal terminal transcript are
not prose sentences. Headings and action labels are listed separately because
they are checked for context and result-naming.

### Landing prose sentences

| Words | Sentence |
| ---: | --- |
| 12 | For developers running coding agents, each worktree gets only approved development variables. |
| 6 | Opens an isolated recorded CLI run. |
| 6 | Only approved variables enter the child. |
| 5 | Receipts list names, never values. |
| 6 | Production labels are denied by default. |
| 8 | Only named keys reach the temporary root chamber. |
| 8 | The recording uses the demo’s two bundled names. |
| 10 | Point each variable name at Keychain, Secret Service, or 1Password. |
| 11 | The broker checks the Git root before starting one child process. |
| 4 | Expiry stops the child. |
| 7 | The receipt lists names, timing, and outcome. |
| 6 | It does not host a vault. |
| 5 | It does not scan repositories. |
| 8 | It denies production-labelled entries by default. |
| 10 | It cannot hide variables from the child that needs them. |
| 3 | Enter variable names. |
| 9 | The helper creates development-only provider references in this browser. |
| 6 | Your names-only config will appear here. |
| 10 | The CLI resolves only the provider references in your config. |
| 5 | The site has no analytics. |
| 6 | Two approved names reach the child. |
| 8 | The temporary directory is removed after the receipt. |
| 6 | Temporary secret leases for worktree processes. |

### Landing headings and actions

| Words | Text | Result |
| ---: | --- | --- |
| 3 | Local CLI · v0.1.0 | Context label; pass. |
| 6 | Lease secrets to one worktree process | Plain job headline; pass. |
| 6 | Try it with sample data | Result-naming action; pass. |
| 3 | See the boundary | F-1-4. |
| 6 | The receipt shows names, never values | Clear section heading; pass. |
| 3 | How it works | Clear section label; pass. |
| 3 | Approve, run, revoke | F-1-5. |
| 3 | Map approved names | Understandable in the following step; pass. |
| 3 | Name the worktree | Clear action; pass. |
| 3 | Read the receipt | Clear action; pass. |
| 3 | What the broker does not do | Clear limitation heading; pass. |
| 3 | Local policy helper | Clear context label; pass. |
| 5 | Generate a names-only team policy | Result-naming action; pass. |
| 3 | Copy install command | Result-naming action; pass. |

### README prose sentences

| Words | Sentence |
| ---: | --- |
| 10 | Give one worktree process only the development secrets it needs. |
| 12 | The broker reads approved values from your OS keychain or 1Password CLI. |
| 9 | It never writes those values to the worktree. |
| 10 | This is for developers who create disposable worktrees for coding agents. |
| 5 | Version 0.1.0 is MIT licensed. |
| 13 | Install the single binary from its public source with Rust 1.85 or newer. |
| 12 | The source repository also supports `cargo install --path .` after cloning it. |
| 11 | The factory can prepare the release package with `cargo package --allow-dirty`. |
| 7 | Registry publishing is handled outside this repository. |
| 13 | The command creates a temporary sample worktree and uses in-memory sample values. |
| 15 | It prints a names-only receipt and deletes the directory when done. |
| 14 | It does not read a keychain, contact a network, or save sample data. |
| 6 | The recorded browser demo is at the displayed URL. |
| 10 | Create `.wsb.toml` outside the worktree, then edit its references. |
| 12 | Start exactly one child process in a named Git worktree. |
| 15 | `wsb` resolves each approved reference and passes the value in the child environment. |
| 16 | The broker kills the child when the lease expires and prints a receipt with names only. |
| 13 | `keychain://SERVICE/ACCOUNT` calls Secret Service on Linux and Keychain on macOS. |
| 13 | `op://VAULT/ITEM/FIELD` calls `op read` and uses your existing 1Password session. |
| 17 | The config may set production labels, but `check` and `run` deny them by default. |
| 11 | An operator can make the exceptional choice with `--allow-production`. |
| 6 | Use `--json` for machine-readable checks and receipts. |
| 7 | The child starts with a cleared environment. |
| 17 | The broker restores a short list of shell basics such as `PATH`, `HOME`, and `TERM`. |
| 11 | Add a non-secret parent variable only when needed. |
| 10 | Child processes and privileged local tools may read process environments. |
| 20 | `wsb` narrows the set and lifetime; it cannot make environment variables invisible to the process that needs them. |
| 6 | Avoid production credentials in agent worktrees. |
| 9 | Stop the broker to revoke the child environment immediately. |
| 13 | `npm test` runs Rust tests, builds the static site, and runs browser claim and accessibility checks. |
| 18 | `npm run build` creates the binary in `dist/bin/` and the deployable site in `dist/site/`. |
| 8 | The static deploy root is `dist/site`. |
| 7 | The site includes a local policy helper. |
| 16 | It turns variable names into development-only provider references without a network request. |
| 9 | The helper does not ask for secret values. |
| 5 | The site has no analytics. |
| 6 | The browser demo uses bundled sample text. |
| 18 | The CLI only resolves the provider references in your config for the child process you start. |
| 8 | See the published privacy and terms pages. |

No prose sentence exceeds 22 words. The flagged landing text is F-1-3 through
F-1-6; no banned marketing adjective was found. Technical terms such as
worktree, child process, keychain, and 1Password are necessary for the stated
developer audience and are explained by the surrounding concrete text.

## Demo, sandbox, and claims verification

- The one-click landing action opens `/demo`; its first screen already shows
  realistic sample names, a completed receipt, and the persistent “Demo —
  sample data, nothing is saved” banner with Reset demo and Start for real.
- In a fresh live context, a `real:sentinel` session key was unchanged when
  entering demo, after Reset demo, and after Start for real. Reset added only
  `demo:reset`; Start for real removed it. No localStorage key or third-party
  request was observed.
- `wsb demo` was run from a fresh temporary directory. It printed the two
  bundled names and names-only receipt, then removed the temporary worktree;
  the invoking temporary directory remained empty.
- Every exact test in `claims.json` was run independently after `npm ci` in a
  fresh clone. All 14 passed: `demo-isolated`, `approved-environment`,
  `names-only-receipt`, `production-denied`, `lease-expiry`,
  `worktree-root-required`, `demo-same-origin`, `recorded-demo-sample`,
  `site-no-analytics`, `policy-generator`, `broker-stop-revokes`,
  `demo-reset`, `copy-install-command`, and `one-password-provider`.
- F-1-1 remains despite those green tests because its visible assertions do
  not have the required one-to-one claim entries/tests.

## Structure, history, and scope checks

- All rendered landing links returned 200 (including the source and Param
  Factory links); the Privacy mail link is a valid `mailto:` target. `/demo`,
  `/privacy`, and `/terms` returned 200. An unknown path returned the designed
  page with HTTP 404.
- Each tested route had one `main`, one h1, a route title within 60 characters,
  a canonical URL, favicon, `lang=en`, a visible skip link, and no Axe serious
  or critical issue. Route focus, cold `/#install`, browser Back scroll
  restoration, and 390 px touch targets are covered in the shipped suite.
- Home and demo request logs contained only the product origin. The live CSP
  is self-only and `frame-ancestors` is correctly a response-header directive.
  The 404 page naturally logs its HTTP 404 resource error; normal routes had
  no console or page errors.
- `robots.txt`, `sitemap.xml`, the service worker, original local artwork,
  privacy/terms footer links, reduced-motion CSS, and self-hosted fonts are
  present. The 12.9 KB raw initial JS bundle is below the static budget.
- Earlier review/polish files do not exist. The earlier handoff and
  verification records were read. Their previously reported concerns are
  confirmed fixed in both current code and live behavior: no dead paid
  checkout, default `CI` exclusion with explicit opt-in, malformed 1Password
  reference rejection, a cold-consumer source install command, 44 px mobile
  targets, true HTTP 404, working hash deep link, and Back scroll restoration.
- The brief describes a deterministic local CLI boundary. No AI, sync, or
  import feature is implied; adding an AI feature would increase the secret
  exposure surface without improving this job. The local policy export helper
  is the useful additional workflow and is present.

## What would make this perfect

Make every user-reliant demo/receipt assertion a precise tested claim, update
social and description metadata for every route, and replace the four
non-informative copy elements identified above. Then rerun the clean-clone
claim matrix, live request-log checks, and route metadata crawl.
