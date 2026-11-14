# Prelaunch review — 9 November 2026

The main `semjid-v4` working copy remains the starting point. Existing edits and the user’s VS Code settings were preserved. This pass made no commit, push, deployment, provider-setting change or remote database write. The current branch is `review/staff-ceo-feedback-polish`, at existing commit `a689c54`.

## Status of the 18 requested items

| # | Item | Status and evidence |
| --- | --- | --- |
| 1 | Above-the-fold CTA | Implemented. The home booking action follows the headline. Browser checks confirmed it is visible at 375px and 1440px widths. |
| 2 | Purposeful internal links | Implemented. Hero treatments link to services. Contact, room selection and booking guidance link to the relevant pages. |
| 3 | Booking thank-you/result page | Implemented and tested with synthetic API responses. A successful save response opens `/booking/confirmation`. The page reloads the authenticated customer’s owned record, shows its current status, and does not claim payment or email delivery. Lost-response retries keep the same request ID. Real isolated-database verification remains necessary. |
| 4 | Breadcrumbs | Implemented for known public/customer pages, with a home link and current-page indication. Private record IDs are not included. |
| 5 | Case studies | Waiting for company-approved factual content and publication consent. No cases or customer outcomes were invented. |
| 6 | Response-time promise | Waiting for an agreed operational commitment. Unconfirmed “respond shortly” and online-status claims were removed. |
| 7 | Sticky mobile CTA | Implemented on public marketing/contact pages. It stays clear of chat and hides for open chat, dialogs, cookie consent and focused form controls. It is absent from booking/private pages. |
| 8 | Robots and indexing | Implemented. Local/preview builds disallow indexing and have an empty sitemap. Public indexing requires a valid HTTPS site origin and an explicitly production Vercel environment. Private pages and APIs send noindex headers. Production account configuration was not changed or verified. |
| 9 | Meta descriptions | Implemented for all ten public pages, with page-specific titles and descriptions. Canonical URLs require the configured valid public origin. |
| 10 | Bank details | Completed in the preceding local pass. Public bank-account instructions were replaced with reception guidance. Cash and staff-verified bank transfer remain supported. Existing ledgers were preserved. |
| 11 | Social share image | Implemented as a local 1200×630 PNG route using the existing logo and business name/locality. Open Graph and Twitter metadata reference it. No external social crawler/cache receipt has been verified. |
| 12 | Maps and directions | Implemented with explicit Google Maps search/directions links for the existing business name and locality. No automatic map request is needed. Reception must confirm the exact arrival point, current travel conditions and transport arrangements. No precise pin or timetable was invented. |
| 13 | Local structured data | Implemented with the existing business names, contact numbers, locality, country and official Facebook page. No fabricated address, hours, ratings, clinical outcomes or precise coordinates. |
| 14 | Broken links | The missing contact page was added. The 13 internal destinations collected by the browser suite returned pages. Facebook/Messenger destinations were resolved in the preceding pass. Real telephone service, transport and external provider availability were not tested. |
| 15 | Copyright | Existing dynamic year retained and checked as 2026. |
| 16 | Placeholders and unused navigation | Focused cleanup completed. Removed the redundant Home navigation item, corrected the treatments destination, removed unconfirmed package/response claims and replaced the public review form’s misleading success placeholder with bilingual moderation guidance. No fake reviews were added. |
| 17 | Dark mode | Implemented with system/light/dark choices, persistence, OS preference changes, storage-failure fallback and shared colour mappings. Representative public/customer/staff/CEO screens and a staff booking form were checked at mobile/desktop widths. Staff business labels remain primarily Mongolian. |
| 18 | Privileged keys | Current source and generated client assets passed the preceding targeted audit. Historical exposed Supabase server and Resend credentials remain a release blocker until revocation/replacement is confirmed. One old Supabase server value matches current local server configuration. This does not establish whether the key remains valid. |

## Verification and limits

- The final source checks passed: 49 automated tests, TypeScript typecheck, lint without warnings, a production build with analytics disabled, and whitespace checks.
- Existing browser results passed 90 public layout/navigation/metadata checks, 28 staff/CEO/manager checks, and 18 booking-result/retry/ownership checks. All remote requests and local API responses in these UI suites were blocked or intercepted using synthetic fixtures outside the repository.
- The browser review found a low-contrast active booking-step number. Its background was darkened. Footer contrast was corrected and passed four focused checks covering both languages and both themes. Another 12 checks passed for booking-summary contrast, admin sign-in theme/contrast/layout/persistence, share-image dimensions, runtime errors and configured fixture endpoints. The rebuilt share image was visually inspected and its logo renders correctly.
- Visual review found insufficient distinction between the coloured hero headline and the bright sky photo. The photo overlay was strengthened and the two coloured headline lines were lightened. Eight final combinations (375px/1440px, light/dark, Mongolian/English) passed above-the-fold CTA and overflow checks. A conservative white-photo background bound gives the three large headline lines contrast ratios of 5.52, 3.65 and 4.32. The final mobile screenshot was visually inspected. There were no runtime errors or unconfigured API calls in that check.
- Solid-colour text contrast was sampled on the tested screens. Photo overlays and gradients require visual review and are excluded from the numeric contrast helper. This is not an exhaustive accessibility audit.
- Successful browser fixtures do not prove actual database writes, live RLS/grants, duplicate submission handling in the deployed database, real payment processing, email delivery or receipt in Google Analytics. Customer feedback’s real isolated-database submission/once-only/refresh checks must be reconciled with the separate database verification evidence. SQL execution alone is not evidence that the customer submission flow passed.
- The earlier targeted bank/key audit checked current text and built client assets, extracted text from both presentation PDFs, and OCR-checked 31 public/generated images. It found no old account number or privileged key on those checked surfaces. The approved blank referral PDF stayed byte-for-byte unchanged. The browser Supabase anon/publishable key is intentionally public.
- Analytics remains disabled. No production branch, deployment, database, credential rotation, QPay or lending integration was changed. The security/analytics handoff records the remaining provider, RLS, abuse-control and operational prerequisites separately.

## Required company inputs

For case studies, provide approved factual stories describing the context and services actually received, publication permission, permitted attribution/photos, and approved Mongolian/English wording. Do not send identifiable medical or customer records in chat. Claims about outcomes need explicit factual approval.

For a response-time promise, agree on the covered channels, staffed days/hours and timezone, who owns replies and escalation, and the maximum response window the team can sustain, including the wording for messages received outside those hours.

For credentials, the account owner must verify revocation of the exposed Supabase server and Resend credentials and securely replace any still-valid value in the appropriate local/staging/deployment secret settings. Verify deployed replacement keys before retiring legacy keys. Supply confirmation or redacted audit evidence, never key values. No history rewrite or credential rotation was attempted here.

## Local review

After the final production-build checks, the regular development preview is restored at `http://localhost:3000`.

- Public home: `http://localhost:3000/`
- Contact and directions: `http://localhost:3000/contact`
- Rooms and booking entry: `http://localhost:3000/rooms`
- Staff/CEO sign-in: `http://localhost:3000/admin/login`
- Staff dashboard: `http://localhost:3000/admin`
- Staff booking management: `http://localhost:3000/admin/bookings/manage`
- CEO dashboard: `http://localhost:3000/admin/ceo`

The confirmation page needs a successful customer booking save and its owner-scoped session marker. Directly visiting it should not fabricate a receipt. Private dashboards require an authorized account. The preview still uses the existing local environment, so review should avoid unapproved writes.

## 14 November 2026 consolidation

- Consolidated the current customer-auth, booking-confirmation, public-page, privacy, theme, metadata and request-validation changes on top of the latest GitHub `main`. The older worktree and migration stash contained the same auth changes; their confirmation screens and logo metadata were incorporated while retaining the newer signup protections and current dependency lockfile.
- Confirmation callbacks now use the existing browser auth client for email token hashes, PKCE codes and implicit email sessions. Credentials are removed from the address bar, unsupported confirmation types are rejected, and provider error details are not displayed. Four new automated regression tests cover these boundaries.
- All 64 automated tests, full lint, TypeScript checks and an isolated production webpack build passed. The lint configuration excludes the existing bundled `Git/` tools from application source checks.
- Compiled browser checks passed for eight confirmation scenarios, seven page smoke checks, three anonymous private API rejections and the 1200×630 share image. Confirmation scenarios used the installed SDK with intercepted synthetic provider responses; the mobile confirmation screen was visually inspected. These checks do not establish real email delivery or live provider/database configuration.
- The 96 changed files passed a check for configured local server secrets and common privileged token formats. Local environment files, the generated project ZIP and original local backups are excluded from the commit. The credential-rotation and other launch prerequisites recorded above still apply.
