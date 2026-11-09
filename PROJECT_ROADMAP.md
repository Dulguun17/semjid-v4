# Semjid development handoff

## Current review step — 2026-11-04

The main `semjid-v4` checkout supplied the intended staff/CEO, payment-ledger,
customer ownership, and private feedback work. The older separate worktree
remains untouched. The review branch is `review/staff-ceo-feedback-polish`.

The focused polish adds a full-width feedback form, mobile profile layout,
saved-feedback announcements, and recovery when another tab has already
submitted feedback. Feedback API tests cover access guards, validation,
ownership inputs, response privacy, and duplicate/ineligible error responses.
Runtime records are no longer printed by the review handler or chat test helper.

The isolated database contains the feedback migration and an actual synthetic
submission recorded by the prior session. Current fresh-session API checks
confirm linked-booking visibility, persisted room/service ratings, rejection of
repeat submissions, and isolation from another customer. Two missing default
customer role rows were restored for the recorded synthetic accounts only.
Detailed evidence, credentials, and database fixtures stay outside Git.

Validation: production build, TypeScript, ESLint, 34 automated tests, and isolated
feedback API checks passed. Browser visual inspection remains for the staging
review; local staff and CEO login success was confirmed by the owner.

The review branch is based on the existing remote `main`, with no unpublished
ancestor commits. Old credential-bearing history is already on that remote;
this branch does not newly publish those commits. Current examples use
placeholders. Private environment files, personal Git/REPL files, and generated
TypeScript build state are excluded from the commit. The isolated server key
found in the local example should be replaced privately before staging; no
credential values belong in this document.

`vercel.json` prevents automatic deployment from this specific review branch.
Other branches retain Vercel's default behavior. The setting follows
[Vercel's Git configuration](https://vercel.com/docs/project-configuration/git-configuration).
No production branch, deployment, database, or live booking availability is
changed by this review step. Public booking and QPay remain closed locally.

## Following steps, in order

1. **Separate live-site investigation.** Verify replacement Supabase keys are
   used before retiring legacy keys; check whether the exposed Resend key was
   revoked. Diagnose missing signup and booking emails separately. For the
   missing booking, first have staff search by its reference. Keep all account,
   customer, credential, and booking details private.
2. **Separate staging preview.** Create a separate Vercel project connected to
   the isolated Supabase project, configure Auth URLs, and verify staff, CEO,
   and customer flows there. Use a staging branch with separately reviewed
   deployment settings.
3. **Customer pages.** Add an illustrated “What to expect” widget, clear room
   pricing/inclusions, a before-arrival checklist, and bilingual booking FAQs.
   Add Messenger beside booking and a footer Facebook link after the owner
   supplies the official page. Consider group inquiries if Semjid accepts them.
4. **Private staff customer history.** For verified repeat customers, show past
   rooms, stay dates, and services actually received. After a completed stay,
   staff can save a 1–5 interaction rating and a short factual note with author
   and date. Keep it separate from customer feedback and invisible to customers.
5. **QPay.** Wait for merchant documentation and test access. Integrate with the
   existing ledger, then verify provider-confirmed payments, duplicate handling,
   failures, and refunds before enabling it live.
6. **Lending.** Wait for the named lender and merchant documentation. Keep
   financing approval separate from payment received.
