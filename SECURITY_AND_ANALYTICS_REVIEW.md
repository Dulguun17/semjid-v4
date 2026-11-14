# Security and analytics handoff

Reviewed locally on 8 November 2026. Production settings, databases and deployment have not been changed by this pass.

## Implemented

- A bilingual consent banner offers equal accept and reject buttons plus preferences. Native dialog preferences can be reopened from the footer. Essential authentication, booking drafts and requested chat work independently of analytics consent.
- The consent record contains only version and analytics boolean. A changed or invalid version defaults to no analytics. Withdraw removes the analytics frame and accessible legacy GA cookies. Changes synchronize across tabs. Blocked storage falls back to a choice for the current visit and prompts again after a full reload.
- Google Analytics requires both the existing measurement ID variable and the explicit server setting `GA_ANALYTICS_APPROVED=true`. The company-approved measurement ID is set in the ignored local environment and the approval flag remains false. Missing or malformed IDs produce no tag. The example configuration leaves analytics disabled.
- The Google tag runs inside a sandbox with scripts enabled and same-origin access disabled. It cannot read the main document, account storage, main URL, forms or cookies. It receives only fixed marketing paths and titles through a sender-checked message. It has its own history and document. The main page never loads the tag.
- Only `/`, `/about`, `/rooms`, `/services` and `/faq` are measured. Every other path is excluded. Query strings, hashes, account and booking IDs, names and medical details are not passed to the tag. Automatic initial page views are disabled. Advertising storage, advertising user data, personalization and Google signals are disabled.
- The sandbox cannot create site GA cookies. Its random technical client identifier restarts when the frame restarts, including full reloads or returning from an excluded route. This reduces repeat-visitor and session continuity. Review that tradeoff before activation.
- Automatic Google Fonts requests were removed in favor of installed font fallbacks. The embedded map was replaced with an explicit external map link. Google requests are not needed before consent. Maps and Meta links open only on user action.
- Cookie and privacy pages describe actual browser storage, account and booking processing, chat, public moderation, separate booking feedback and optional analytics. They avoid invented retention periods and legal compliance claims.
- The active configuration is `next.config.js`. The separate existing `.mjs` file is inactive. Next response headers now include no-referrer, nosniff, frame protection, object/base/form CSP restrictions and permissions restrictions. Production gets HSTS. CSP retains inline scripts/styles needed by the current Next application and eval only for development. Nonce-based CSP remains a future hardening decision, not a claim of complete XSS protection.
- Manager-only uploads have streamed size limits, a MIME allowlist, basic file-signature checks and randomized non-overwriting paths. HTML, SVG and arbitrary filename extensions are rejected. Supported office documents are retained. Signature checks are not malware scanning.
- Public reviews have bounded, strictly validated input. The server returns only approved reviews with public fields, and does not echo inserted records or database errors. Private completed-booking feedback remains separate.
- Public chat accepts bounded messages and random UUID session identifiers, matching the supplied session header when present. Chat initializes browser storage on opening rather than every page view. Chat remains a bearer-session conversation, not verified customer authentication.
- Signup request sizes and contact fields are bounded. Public signup errors and server API logs avoid raw database/provider error details. Existing same-site redirect checks and role/ownership boundaries were preserved.

## Company and account setup before activation

1. The company supplied approved GA4 stream ID `G-2JLBR5H6HB`. It is configured locally with collection off. Add that ID to the separate Vercel staging project in Preview scope and confirm company ownership/access. Keep `GA_ANALYTICS_APPROVED=false` until staging review is approved.
2. In the GA4 web stream, disable enhanced measurement for history-based page views, forms, outbound links, site search, downloads, video and scroll. The isolated document prevents these features from inspecting the application, but account settings should still reflect manual page-view-only measurement. Keep Google signals, ads links and user-provided-data features off. Choose account data retention and regional processing controls with the company.
3. Review policy wording, identify the responsible company/controller and privacy contact, decide server-side retention and deletion handling for accounts, bookings, chat, feedback and financial records, and determine how data requests are verified. No retention schedule or statutory compliance has been approved in this code pass.
4. Confirm that the loss of cross-session analytics identifiers is acceptable. Validate the real property in a controlled staging session after approval. Intercepted-tag tests verify isolation and request payloads, not receipt in a real GA property or all future vendor behavior. Repository inspection found one consent-gated gtag loader and no GTM container. Any tag installed through an external dashboard or snippet injector remains unverified.

## Security and launch prerequisites

- Verify replacement Supabase keys in the live deployment before retiring old keys. Confirm that all exposed server and Resend keys were revoked. Credential rotation and account audit logs were not accessible or changed here. Removing files from the current tree does not erase old public Git history.
- Audit live Supabase grants, RLS, exposed schemas and Storage policies. Ensure customers can access only owned bookings and feedback, staff access only permitted workflows, CEO gets permitted aggregates, and only managers can upload. Service-role keys bypass RLS and must remain server-only. Source migrations and local tests do not prove live policy state.
- Keep completed medical documents out of public template/image buckets. Existing manager template uploads return public URLs. Approve a separate private storage and access model before introducing medical uploads.
- The existing workspace migration grants direct public inserts through the policies `Public send customer chat messages` and `Public submit unapproved reviews`. Those paths bypass application body/field limits. Review and remove direct public insert policies in the isolated database, preserve permitted staff operations, and verify the final RLS/grants before applying an approved change to production. This pass makes no database or SQL-policy changes.
- Choose and deploy durable edge/API rate limits and, where needed, bot protection for signup, chat, public reviews and uploads. This pass bounds request sizes but does not provide a shared distributed abuse limiter. Supabase Auth rate limits do not protect service-role-backed chat/review endpoints.
- Enforce staff and manager MFA/AAL2 at the auth and server-policy boundary, and review organization/project access. Current workspace guards verify identity and role, not MFA assurance.
- Verify confirmation and booking email delivery separately, including approved sender, provider status, redirects and safe logging. A saved booking does not prove notification delivery.
- Establish backup ownership, retention, restore testing, monitoring, incident response and deployment rollback. Confirm TLS and staging/production environment separation.
- Use an isolated Supabase staging project and review public, customer, staff and CEO flows before deployment. Production online booking remains gated. QPay and lending remain deferred.

## Verification

- 47 automated tests cover existing booking/payment/role logic plus consent parsing, exact path allowlisting, sender-checked frame commands, shutdown, bounded streaming JSON, spoofed/active upload rejection and bank-account disclosure in public booking copy.
- 47 local production-preview browser checks used the approved GA4 ID with intercepted tag/collection responses. They verified one configuration for that exact ID and excluded synthetic account, billing, user and medical values. They covered no Google requests before consent, accept/reject/reload/withdraw, cross-tab withdrawal, inaccessible parent URL/storage/cookies, sanitized SPA paths, sensitive routes, both languages, mobile layout, storage failure, active security headers, anonymous guard failures and invalid requests.
- A disabled production preview made no Google requests or analytics frame after accepting analytics with no measurement ID. The development booking path still reached the sign-in summary after rejecting analytics, and the referral PDF remained downloadable.
- Source and generated client bundles were scanned against known server secrets. No matches were found. Company account settings, live policies, real Google receipt and incident/backup procedures remain unverified.

## Reference documentation

- [Google manual page views](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [Google privacy settings and disabling collection](https://developers.google.com/tag-platform/security/guides/privacy)
- [Google PII guidance](https://support.google.com/analytics/answer/6366371)
- [Enhanced measurement controls](https://support.google.com/analytics/answer/9216061)
- [Supabase API grants and RLS](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase production security checklist](https://supabase.com/docs/guides/security/production-checklist)


## 9 November prelaunch pass for bank details and privileged keys

Scope was limited to removing company bank-account disclosure and checking privileged keys. Existing private ledgers and history were preserved. No remote database access, production change, commit, push or deployment was performed.

- Replaced the bank-account translation with bilingual instructions to contact reception. Removed unused bank-holder and payment-reference instructions. Removed the bank-specific setup-guide row. Cash and staff-verified bank transfer remain supported.
- Current repository text and rebuilt public assets contain no match for the old account details. Both presentation PDFs were checked through text extraction and contain no embedded raster images. OCR of 31 public/generated images, including a rendering of the referral PDF, found no matching account number. The approved referral PDF is byte-for-byte unchanged.
- 185 current text files and 47 rebuilt public files were checked. No privileged key was found in those surfaces. The configured browser Supabase key was classified as an intended public `anon` key. Publishable/anon keys and GA measurement IDs are public identifiers and were not removed or relabeled as server secrets.
- 47 automated tests, typecheck, lint and the production build passed. Another 26 local browser checks covered bilingual reception guidance at mobile/desktop sizes, the referral download, unauthenticated API access, and checked page/response/request/browser-log surfaces. Remote calls were blocked/intercepted. Private successful database responses and live CMS/provider settings were not queried.

### Essential release blocker

Git history contains Supabase server and Resend API credentials in older `env.local` and `.env.example` revisions. One historically exposed Supabase server key still matches the current local server configuration. This match proves the configuration has not been replaced with a different value, but does not prove that the old key remains valid. Revocation status could not be verified under this pass's no-remote-access constraint.

The account owner must confirm revocation of the exposed credentials, replace any still-valid exposed keys, and update the appropriate local/staging/deployment secret settings through a secure channel. No key values are recorded in this report. Production credential replacement and retirement must follow an explicitly approved controlled rotation. Deleting keys from current source or rewriting a display label does not revoke them or erase existing Git history.
