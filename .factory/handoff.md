# Handoff — adversarial first-read review 1

## Result

**FAIL.** No product code was changed. The complete review is
[`review-1.md`](review-1.md).

## Verification performed

- Used fresh 390 px and desktop browser contexts against the deployed site.
- Cloned the checkout into a fresh temporary directory, ran `npm ci`, then ran
  all 14 exact commands in `.factory/claims.json`; all passed.
- Ran `npm run build` in that clean clone and ran `wsb demo` from a temporary
  directory; the demo cleaned up its temporary worktree.
- Checked live routes, requests, demo storage isolation, reset behavior, link
  status, HTTP 404, metadata, accessibility, and earlier verification fixes.

## Open work

Resolve F-1-1 through F-1-6 in `review-1.md`: add one-to-one tests for the
visible demo/receipt claims, correct per-route social metadata, and replace
the non-informative copy. Re-run the clean-clone claim matrix and live route
checks after the repair.
