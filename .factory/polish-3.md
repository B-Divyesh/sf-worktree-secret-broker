# Polish round 3 — cumulative review closure

Repaired from candidate `d8d2e3ef755c520934d4f6885c3e19db664d96ef` and
review commit `0466ed3c7bc3e5d68ce315499317aae5861b0e30`. Product repair
commit: `f696c75cab164b7d973d04e120dabeefae9bcbab`. It was deployed as Static
Web Apps deployment `07122bb5-b66e-4d19-a5e0-711e30e33c91` to
<https://worktree-secret-broker.sociobot.in> on 2026-08-29 UTC.

Every review finding is closed below. Paths are relative to the repository.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Retained the direct `?demo=1` sandbox, persistent banner, explicit `demo:` storage namespace, Reset demo, Start for real cleanup, and complete browser/CLI receipt comparison. | Clean-clone `@claim:demo-browser-isolation`, `@claim:demo-reset`, and `@claim:recorded-demo-receipt` passed. Live storage flow is in `qa-artifacts/polish-3-live/live-audit.json`; screenshot: `qa-artifacts/polish-3-live/demo/screenshot-mobile.png`; URL: <https://worktree-secret-broker.sociobot.in/?demo=1>. |
| F-1-2 | Retained static route documents and client metadata updates for title, description, canonical, Open Graph, Twitter, and the HTTP 404 override. | Clean-clone `each route updates its social metadata after client navigation` and `production output emits real routes and a designed HTTP 404 override` passed. Live routes and HTTP statuses are in `qa-artifacts/polish-3-live/live-audit.json`. |
| F-1-3 | Retained the direct hero caption: “Only approved variables reach the named worktree process.” | Clean-clone `@claim:approved-environment` passed; screenshot: `qa-artifacts/polish-3-live/home/screenshot-desktop.png`; URL: <https://worktree-secret-broker.sociobot.in>. |
| F-1-4 | Retained the informative preview label: “Sample names-only receipt.” | Full clean-clone browser suite passed; screenshot: `qa-artifacts/polish-3-live/home/screenshot-desktop.png`; URL: <https://worktree-secret-broker.sociobot.in>. |
| F-1-5 | Retained the self-contained process heading: “Run one worktree process in three steps.” | Full clean-clone browser suite and live Axe audit passed; screenshot: `qa-artifacts/polish-3-live/home/screenshot-desktop.png`. |
| F-1-6 | Retained the plain demo H1: “See the CLI run with sample worktree data.” | Clean-clone `@claim:offline-demo` passed. Live direct demo verifier: `qa-artifacts/polish-3-live/demo/verify.json`; URL: <https://worktree-secret-broker.sociobot.in/demo>. |
| F-2-1 | Retained documented Secret Service and macOS Keychain command contracts plus the dedicated provider claim. | Clean-clone `@claim:os-keychain-provider` and `npm run check:macos` passed. |
| F-2-2 | Retained duplicate-name rejection and the no-secret-value input boundary with its own claim. | Clean-clone `@claim:policy-helper-input-boundary` passed. |
| F-2-3 | Retained the split README wording for expiry, broker stopping, and the names-only receipt; no sentence exceeds 22 words. | `.factory/copy-audit.md`; clean-clone full `npm test` passed. |
| F-2-4 | Retained the useful “Limits” label above the broker boundaries. | Full clean-clone browser suite passed; screenshot: `qa-artifacts/polish-3-live/home/screenshot-desktop.png`. |
| F-3-1 | Added `license-token-privacy` to `claims.json` and a clean-browser tagged test that records every request through checkout return, pasted token, cached reload, invalidation, and demo. It proves tokens are stripped from the URL, only the precise Sociobot verification endpoint receives them, and demo does not access license storage. Rewrote the license form and Privacy H1/body to state that exception plainly. | Clean-clone `@claim:license-token-privacy` passed. Live intercepted flow is in `qa-artifacts/polish-3-live/live-audit.json`; URL: <https://worktree-secret-broker.sociobot.in/privacy>. |
| F-3-2 | Removed merchant-of-record, refund-handling, and refund-revocation promises from landing, README, and Terms. The remaining tested purchase statement is: “Team review tools cost $19 once. License checks use Sociobot.” | Clean-clone `regression: review 3 copy names license data handling and avoids unprovable purchase promises` and `@claim:paid-team-review` passed. Live Terms: <https://worktree-secret-broker.sociobot.in/terms>. |
| F-3-3 | Replaced the hero H1 with “Give one worktree process approved variables.” Updated home title and social metadata to match the plain job wording. | Clean-clone `regression: review 3 copy names license data handling and avoids unprovable purchase promises` passed. Cold live evidence: `qa-artifacts/polish-3-live/home/verify.json` and `home/screenshot-mobile.png`. |
| F-3-4 | Replaced the generic paid-section H2 with “Team policy review checklist.” | Clean-clone `regression: review 3 copy names license data handling and avoids unprovable purchase promises` passed. Live home screenshot: `qa-artifacts/polish-3-live/home/screenshot-desktop.png`. |

## Final evidence

- Clean clone: `/tmp/wsb-polish3-clean.XtcN5d/repo` at
  `f696c75cab164b7d973d04e120dabeefae9bcbab`.
- All 23 exact commands in `.factory/claims.json` passed independently
  (`ALL_CLAIMS_PASS 23`).
- Clean-clone `npm test` passed 38/38 browser tests and 6/6 Rust unit tests.
  It includes Axe, keyboard, reduced-motion, mobile, offline, demo, routing,
  and privacy cases.
- Clean-clone `npm run build`, `npm run check:macos`,
  `cargo package --allow-dirty --locked`, and `npm audit --audit-level=high`
  passed. The initial macOS check required installing the standard
  `x86_64-apple-darwin` target in the disposable container; the checked source
  passed once the target was present.
- Live `verify-url.sh` passed cold home and direct `?demo=1`. Screenshots and
  zero-error reports are under `qa-artifacts/polish-3-live/home/` and `demo/`.
- Live Lighthouse mobile: 100 performance, 100 accessibility, 100 best
  practices, 100 SEO; LCP 1804.8 ms; CLS 0. Report:
  `qa-artifacts/polish-3-live/lighthouse.json`.

No review finding remains unresolved.
