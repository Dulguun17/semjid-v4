# Staging deployment plan

This plan is for a non-production Vercel project only. Do not follow older
production launch guides for staging. Do not deploy until the staging project,
environment, and URLs have been reviewed.

## Hosting and database

The repository identifies Vercel as its intended host in `README.md` and the
deployment guides. `vercel.json` only disables Git auto-deployments for the
`review/staff-ceo-feedback-polish` branch; it does not link a Vercel project.
Create a **separate Vercel project** for staging and connect it to the
staging branch. Do not reuse the production Vercel project or production
environment-variable scope.

Point every staging Supabase variable at the confirmed isolated project
`kikzxeksdjkacubnfmtn`. The role, staff workflow, payments, CEO reporting, and
customer ownership and feedback migrations are already applied there; do not run
`supabase/schema.sql` or rerun those migrations. Never copy real customer data
into staging.

## Vercel environment variables

Configure these only in the separate staging Vercel project, under **Preview**
environment variables, scoped to the staging branch:

| Variable | Staging value source / handling |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from the isolated Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable/anon key from that same isolated project |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret server-side key from that same isolated project; never use a `NEXT_PUBLIC_` name |
| `NEXT_PUBLIC_SITE_URL` | Exact HTTPS origin assigned to staging, with no trailing slash |
| `BED_AVAILABILITY_PREVIEW` | Explicitly `false`; public preview is not part of this deployment |

`NEXT_PUBLIC_GA_MEASUREMENT_ID` is optional; leave it unset unless staging
analytics is explicitly approved. Do not configure production Supabase values,
`RESEND_API_KEY`, SMS credentials, QPay credentials, `ADMIN_EMAIL`, or any
notification provider credentials. Notification sending is not wired to a
production transport in this phase.

After entering variables, use Vercel's environment-variable view to verify
their names and Preview scope without copying or printing values. Check the
Supabase URL's project reference locally against the isolated project before
deployment.

## Supabase Auth URL configuration

Auth URL settings are project-specific. Public Auth settings do not expose the
configured Site URL or redirect allowlist, and the staging domain does not yet
exist, so these URLs cannot be verified in advance.

After Vercel assigns the staging HTTPS URL, open the **isolated test project**
in Supabase Dashboard and go to **Authentication → URL Configuration**:

1. Set **Site URL** to the exact canonical staging origin, for example
   `https://<staging-host>`.
2. Add only the staging callback allowlist entry
   `https://<staging-host>/**`. If preview deploys are needed, add a narrowly
   scoped branch-preview pattern for this Vercel project only; do not allow
   arbitrary Vercel hosts.
3. Keep production URLs in production's separate Auth configuration. Do not
   edit that configuration as part of staging.

The current password login and signup flows do not pass an explicit Auth
redirect URL. Set the Site URL and allowlist anyway so Auth's default redirects
cannot fall back to localhost or an unrelated host.

## Staging-only behavior and limitations

- Public booking submission remains closed (`/api/booking` returns HTTP 410).
- QPay remains disconnected and its QR endpoint returns HTTP 410.
- `BED_AVAILABILITY_PREVIEW` remains false; production mode also disables that
  preview route.
- Do not configure email, SMS, QPay, or other real notification/payment
  credentials. The isolated test project's email auto-confirm setting is for
  test accounts only; production must retain its independently approved
  verification policy.
- Staging shares the isolated test database and its synthetic test fixtures;
  it is not production and must not receive real client data.

Before any later production launch, separately decide and configure QPay,
notification delivery, cancellation/refund terms, booking availability,
account verification, data-retention, and business/legal policies. Those
decisions are not part of this staging deployment.

## Secret and test-evidence handling

`.gitignore` excludes private environment files, local credentials, and test
evidence. `.vercelignore` excludes the same categories from deployment uploads.
`env.local` is kept on the developer's machine but removed from Git tracking.
Generated signup passwords and tokens and the detailed E2E evidence remain
outside the repository in the permission-restricted session files.

The repository's earlier history may still contain credentials that were
previously committed. Removing current copies does not erase Git history. Before
publishing or deploying from a public repository, revoke/rotate any still-valid
credentials found in the prior history and coordinate any required history
cleanup. Never paste secret values into chat or logs.

## Final staging gate

Before the first staging deployment:

- Confirm this separate Vercel project is linked to the staging branch.
- Confirm all Supabase settings resolve to `kikzxeksdjkacubnfmtn`, not production.
- Set the staging Site URL and redirect allowlist after the Vercel URL exists.
- Confirm no notification/payment credentials are configured.
- Confirm bookings and QPay remain closed and test evidence is absent from the
  Git commit and Vercel upload.
- Run the staging build and smoke checks after the URL and Preview variables
  are set.

No deployment has been performed by preparing this plan.
