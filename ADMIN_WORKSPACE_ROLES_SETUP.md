# Staff and CEO workspaces: role setup

## What this phase changes

Roles live in `public.workspace_roles`, not user-editable auth metadata:

- `customer`: default for public signups and all existing accounts until explicitly assigned.
- `staff`: booking operations, calendar, room availability, contacts, messages, and booking records.
- `ceo`: read-only business overview.
- `is_manager`: explicit additional permission for a staff account to change settings, website content, and room pricing. A CEO cannot also be a manager.

Public signup ignores any requested role and the database trigger assigns `customer`. Users cannot insert, update, or delete role assignments. RLS is the enforcement layer for direct Supabase access; workspace navigation and guarded server endpoints add application-level checks.

Server-only upload, review, chat, and availability handlers require `SUPABASE_SERVICE_ROLE_KEY` in the deployment secret manager. Keep it server-side; never add it to a `NEXT_PUBLIC_*` variable or expose its value in logs or source.

## Apply the role migration

1. Back up the Supabase project using the normal database backup process.
2. In the Supabase dashboard for the **intended non-production project**, open **SQL Editor**.
3. If this is an existing project, **do not run `supabase/schema.sql`**: it drops application tables. Run [`supabase/workspace_roles_migration.sql`](./supabase/workspace_roles_migration.sql) once against the existing database.
4. Confirm it completed successfully before deploying the application changes.

For a new database only, apply the initial schema and required table setup, then run the phase migrations in the order documented below. Never rerun legacy SQL setup scripts after the role migration; the role migration preserves existing bookings, messages, settings, content, reviews, and room blocks, replaces workspace RLS policies, and does not delete booking records.

## Assign existing authorized administrators

No existing user is automatically promoted. Review the current authorized administrator list outside the application, verify each identity, then run a separate SQL statement for each person in the Supabase SQL Editor. Replace the placeholder with the verified sign-in email:

```sql
-- Grant staff access to an existing, verified account.
insert into public.workspace_roles (user_id, role, is_manager)
select id, 'staff', false
from auth.users
where lower(email) = lower('verified-staff@example.com')
on conflict (user_id) do update
set role = excluded.role,
    is_manager = excluded.is_manager,
    updated_at = now();

-- If this person is explicitly authorized to manage settings/content/pricing:
update public.workspace_roles
set is_manager = true, updated_at = now()
where user_id = (
  select id from auth.users
  where lower(email) = lower('verified-manager@example.com')
)
and role = 'staff';

-- Grant the separate, read-only CEO workspace:
insert into public.workspace_roles (user_id, role, is_manager)
select id, 'ceo', false
from auth.users
where lower(email) = lower('verified-ceo@example.com')
on conflict (user_id) do update
set role = excluded.role,
    is_manager = false,
    updated_at = now();
```

Verify that each statement matched exactly one intended account before proceeding. Role assignment is a privileged database operation; never expose the SQL editor, service-role key, or role-management ability to public users. Role changes are intentionally not available in the website UI in this phase.

## Permission checks after setup

Run this checklist only against the isolated non-production project after applying the migration. Use separate browser profiles and Supabase user access tokens for each account; never use the service-role key as a test user.

### Signed out

- [ ] Visit `/admin`, `/admin/bookings/manage`, `/admin/calendar`, `/admin/rooms`, `/admin/guests`, `/admin/chat`, and `/admin/ceo`; each workspace route shows the signed-out denial/login state.
- [ ] Call `POST /api/chat/reply` without a bearer token; expect `401`.
- [ ] Call `POST /api/upload` and `POST /api/upload-image` without a bearer token; expect `401`.
- [ ] Call `POST /api/booking`; expect `410 Gone` (bookings remain closed).
- [ ] Query `bookings` and `workspace_roles` through the public Supabase key; expect no protected rows or writes. Public settings/content/room reads are intentionally available, and public chat inserts are allowed without chat reads.

### Customer account

- [ ] Sign in and visit staff and CEO workspace routes; each shows access denied.
- [ ] Call `/api/chat/reply` and the upload endpoints with the customer bearer token; expect `403`.
- [ ] Select or mutate `bookings`, select `chat_messages`, and mutate `workspace_roles` directly with the customer token; expect RLS denial. The customer may select only their own `workspace_roles` row.
- [ ] Invoke `get_ceo_booking_overview()`; expect denial.
- [ ] Send a public chat message and reload its history using that chat's `x-chat-session` capability; expect only that session's messages. Omit the capability; expect `401`. Try a fresh, unknown session ID; expect an empty history.

### Staff account (not a manager)

- [ ] Open staff bookings, calendar, availability, contacts, messages, and payments pages; they load.
- [ ] Read booking records directly; expect success. Change bookings through the staff application, not direct table writes. Attempt direct booking writes or changes to settings, content, room pricing, or role assignments; expect denial. The staff user may select only their own `workspace_roles` row.
- [ ] Call `/api/chat/reply` with the staff token; expect success. Call the upload endpoints; expect `403` because the account is not a manager.
- [ ] Visit `/admin/ceo` and invoke `get_ceo_booking_overview()`; expect denial.

### Manager (staff account with `is_manager = true`)

- [ ] Verify staff operations work as above.
- [ ] Open settings, content, and room-pricing pages; direct writes to the corresponding tables succeed.
- [ ] Call both upload endpoints with the manager token; expect success.
- [ ] Attempt to modify `workspace_roles` directly; expect RLS denial. The manager may select only their own role row; role assignment remains a privileged SQL-editor operation.
- [ ] Visit `/admin/ceo` and invoke `get_ceo_booking_overview()`; expect denial.

### CEO account

- [ ] Open `/admin/ceo`; the read-only overview loads. Staff routes show access denied.
- [ ] Invoke `get_ceo_booking_overview()`; expect success with aggregate operational counts only.
- [ ] Select or mutate `bookings`, `chat_messages`, payment history, room availability, or room blocks; expect RLS denial.
- [ ] Attempt to modify `workspace_roles`; expect RLS denial. The CEO may select only their own role row. Public settings, content, and room reads remain available by design.
- [ ] Call `/api/chat/reply` and both upload endpoints; expect `403`.

Record each result and the migration version tested. Do not treat booking `total` or `payment` fields as verified receipts.

Use separate signed-in test accounts for customer, staff, manager, and CEO. In Supabase Table Editor or the REST API with each account's normal user access token, verify:

| Action | Signed out | Customer | Staff | Manager staff | CEO |
|---|---:|---:|---:|---:|---:|
| Read booking records directly | denied | denied | allowed | allowed | denied |
| Read CEO operational summary RPC | denied | denied | denied | denied | allowed |
| Change bookings directly | denied | denied | denied | denied | denied |
| Read/write chat records | public client message only / no reads | no reads | allowed | allowed | denied |
| Read room prices | allowed | allowed | allowed | allowed | allowed |
| Change room prices/settings/content | denied | denied | denied | allowed | denied |
| Open staff workspace | denied | denied | allowed | allowed | denied |
| Open CEO overview | denied | denied | denied | denied | allowed |
| Read own role row | n/a | allowed | allowed | allowed | allowed |
| Change any role row | denied | denied | denied | denied | denied |

Also call `/api/chat/reply` and the upload endpoints without an authorization header, with a customer token, with a staff token, and with an explicitly manager-authorized staff token. Missing credentials must return `401`; an authenticated but unauthorized role must return `403`. A CEO can invoke only the aggregate overview RPC, not select booking rows directly. Direct table access must be denied by RLS even when the interface is bypassed.

The database checks above require applying the migration and having test accounts in the target Supabase project. They are not represented as completed by local build/type checks.

## Staff booking workflow migration

The separate phase-two workflow migration adds database-backed physical-room and bed inventory, room capacity and price fields, bed-level staff booking RPCs, booking lifecycle/audit fields, room-closure audit and concurrency checks, and pending-reservation expiry. It preserves booking rows and does not invent historical check-in, checkout, payment, or cancellation events. Active bookings without bed assignments receive an allocation-required flag and conservatively block availability until staff resolves them.

### Migration order

- **Existing database:** apply `supabase/staff_booking_workflow_migration.sql` after `supabase/workspace_roles_migration.sql`. Do not run `supabase/schema.sql` on any database containing records; that legacy bootstrap drops tables.
- **Empty test database:** apply `supabase/schema.sql`, then `supabase/create_rooms_table.sql`, then `supabase/workspace_roles_migration.sql`, `supabase/staff_booking_workflow_migration.sql`, `supabase/payment_records_migration.sql`, `supabase/ceo_business_dashboard_migration.sql`, `supabase/customer_booking_ownership_migration.sql`, and `supabase/customer_booking_feedback_migration.sql` in that order.
- Use only an isolated non-production database for validation, with synthetic records and separate customer, staff, manager, and CEO users. Do not copy real client records. Do not apply either migration to production as part of this phase.

The workflow migration seeds the existing 39 physical-room inventory and eight room categories only when missing; existing category prices take precedence over defaults. Review the resulting room inventory and prices with an authorized manager before staff use. Current rules are stored in `booking_config`: seven nights, up to three months ahead, and a 30-minute pending hold by default. The interface reads the stay-date policy from the staff-only RPC; database functions enforce the same policy. Managers may configure pending expiry from **Admin → Settings** (5 to 43,200 minutes); stay nights and advance months are not writable through the application.

Each physical bed receives a stable ID such as `101-B1`; assignment rows retain their release and audit history. Staff must assign one distinct bed per guest. Legacy active bookings are not assigned beds automatically. Resolve them from the staff booking editor; while any unresolved legacy booking overlaps a stay, new availability remains blocked. Never mark a bed available merely because an old booking lacks an assignment.

Room sharing requires every guest in a room to have the same known gender, including guests within one group reservation. Overlapping opposite-gender, mixed, unknown, missing, or unresolved assignments are rejected. Adjacent stays do not overlap. Staff must ask each guest and must not infer gender from names. The database migration flags conflicting or incomplete historical assignments for staff review without changing guest details or cancelling reservations.

The unlinked local customer preview is `/rooms/availability`. To inspect it locally, set the non-secret `BED_AVAILABILITY_PREVIEW=true` flag in the working copy's root `.env.local` and restart the app; the server also needs its existing server-only Supabase service-role configuration. The route is disabled otherwise. Its endpoint returns only public room/category and bed IDs, per-bed selected-date state, and—only for a bed currently occupied—the occupant's recorded gender plus scheduled-departure countdown. It never includes booking IDs, names, contacts, notes, or references. The countdown uses Asia/Ulaanbaatar calendar dates; overdue guests remain shown as occupied until staff records actual checkout. A scheduled checkout is not a promise that a bed will be free afterward. Public booking submission remains closed. Do not set this flag in production or publish/link the page until the public feed receives separate approval.

Pending holds expire when staff load bookings/rooms, check availability, or create a booking. For unattended expiry, enable the Supabase Cron extension in the test project and schedule `public.expire_pending_bookings()` every five minutes. Example SQL, run only once in the test project:

```sql
select cron.schedule(
  'expire-pending-bookings',
  '*/5 * * * *',
  $$select public.expire_pending_bookings();$$
);
```

### Phase-two permission and behavior test checklist

Run all database/RLS checks only after the workflow migration has been applied to the isolated test project. Use separate browser sessions and normal user access tokens. Never use a service-role key for user permission tests.

- [ ] **Signed out:** `/admin/bookings/manage`, `/admin/rooms`, and `/admin/settings` deny access; `GET /api/staff/bookings`, `GET /api/staff/rooms`, and `GET /api/availability` return `401`; direct Supabase reads/writes of `bookings`, `room_units`, and `room_blocks` are denied. `POST /api/booking` remains `410 Gone`.
- [ ] **Customer:** the same staff pages and staff endpoints return access denied (`403` after sign-in); direct `bookings`, `room_units`, `room_blocks`, `booking_config`, and audit-table access is denied. A forged signup role or direct `workspace_roles` update cannot promote the account.
- [ ] **Staff:** staff pages and `GET /api/staff/bookings`, `GET /api/staff/rooms`, and valid `GET /api/availability` requests succeed. Direct booking `SELECT` succeeds, but direct booking insert/update/delete fails; `POST/PATCH /api/staff/bookings` succeeds only through checked RPCs. Room closures can be created/cancelled through staff access. Direct room-price, room-inventory, config, and role changes fail.
- [ ] **Manager:** all staff checks pass. Manager-only settings and room-price changes and the pending-expiry setting succeed. Direct `workspace_roles` changes still fail. A manager cannot use the CEO overview unless separately assigned CEO (and role constraints prevent a CEO from also being a manager).
- [ ] **CEO:** `/admin/ceo` and `get_ceo_booking_overview()` return only intended aggregates. Direct reads of bookings, room inventory, room blocks, chat, and payment details and any writes fail; all staff endpoints deny access. Do not use booking totals as received-money figures.
- [ ] **Capacity and dates:** create synthetic stays for overlapping dates until capacity is reached; the next request must fail, requests that would exceed remaining beds must report unavailable, adjacent stays must not overlap, and dates outside the configured seven-night/three-month policy or malformed dates must fail.
- [ ] **Concurrency:** with exactly one bed remaining, send two simultaneous booking requests for the same room and overlapping dates. At most one may succeed; the final total must not exceed capacity.
- [ ] **Closures and expiry:** a room closure overlapping an active reservation must fail; a closure must prevent a new booking; cancellation of a closure restores availability. Advance a synthetic pending hold past its expiry and verify it becomes cancelled and no longer consumes capacity; test the scheduled cron job separately from request-triggered expiry.
- [ ] **Changes and audit:** editing a booking rechecks capacity and dates; a price change without a reason fails; a valid price adjustment uses the trusted current database rate and records the reason; without the explicit adjust flag, the agreed existing total remains unchanged. Cancellation/no-show/check-in/out update status without deleting history.
- [ ] **Individual beds:** a single bed cannot be assigned to overlapping stays, while adjacent stays are allowed; two simultaneous requests for the last bed result in at most one success. A multi-guest booking requires the same number of distinct beds as guests, and changing room, dates, guest count, or assignments repeats the checks.
- [ ] **Gender sharing:** every guest assigned to a room must have the same known gender, including guests in one group reservation. Overlapping same-gender reservations can share a room; opposite, mixed, unknown, missing, or unresolved genders cannot. Adjacent stays do not overlap. Staff reassignment must repeat these checks, and names must never influence gender.
- [ ] **Current occupancy and dates:** the preview distinguishes a bed occupied now from a bed reserved for the selected dates. Current occupancy shows only gender and scheduled departure. Verify “Leaves today,” positive Ulaanbaatar calendar days, and overdue-without-negative-countdown behavior; an overdue checked-in stay remains unavailable until actual checkout is recorded.
- [ ] **Public response privacy:** with preview enabled only in the isolated local/test environment, inspect the raw `/api/bed-availability` response. Confirm there are no booking IDs, names, phone/email, references, notes, or other booking fields. With the preview flag unset, the endpoint returns `404`; do not test or enable the feed on production.
- [ ] **Closures:** a closure overlapping an active reservation is rejected; a closure blocks new assignments; cancelling the closure restores availability. Closure writes and booking writes use the same per-room database lock.

Record which migration revision and synthetic test identities were used. A local build or TypeScript check does not validate RLS, RPC permissions, or concurrent database behavior.

## Phase-three payment-recording migration

The reception ledger is additive and follows the role and booking-workflow migrations:

- **Existing database:** apply `supabase/payment_records_migration.sql` after `supabase/workspace_roles_migration.sql` and `supabase/staff_booking_workflow_migration.sql`.
- **Empty test database:** use the full migration sequence above, continuing with CEO reporting and customer ownership/feedback after payment records.
- Never apply this migration to production as part of this phase, and do not run `supabase/schema.sql` against a database containing records.

The migration creates append-oriented booking payment records and actor/reason audit events. It does not import or infer receipts from legacy `bookings.total`, `bookings.payment`, or `bookings.payment_status`. Historical receipts remain unknown until supported by a newly recorded payment. Payment entry amounts are whole MNT units stored as integers; do not enter decimal or floating-point amounts.

Staff can record received cash, record a bank transfer as pending, or mark a transfer completed after checking it was actually received. A booking can have multiple deposits/receipts. Refunds begin as requests, reduce net receipts only after a manager records that money was returned, and are limited to verified receipts not already refunded or requested. Managers alone can complete refunds or void a mistaken record; these actions require a reason and preserve the original entry and its audit history. Booking status is independent from these payment records, and changing a booking to confirmed never marks it paid. Managers alone can explicitly adjust an existing booking price.

Run these checks only with synthetic records in the isolated test database and normal account tokens:

- [ ] Customer and CEO cannot read payment rows or invoke payment RPCs; staff and manager-staff can read the reception ledger.
- [ ] Staff can record cash and pending bank transfers but cannot directly insert/update/delete payment records.
- [ ] A verified bank transfer changes to completed only after staff confirms receipt; pending records do not increase received totals.
- [ ] Record two or more deposits and confirm exact integer totals, remaining balance, and overpayment.
- [ ] Replay the same idempotency key and payload; confirm it returns the same record. Reuse that key with a different payload and confirm it is rejected.
- [ ] Request a partial refund; verify it does not reduce net received until a manager marks the money returned. Reject refund requests/completions that exceed verified receipts.
- [ ] Staff cannot complete a refund or void/correct a payment; a manager can only do so with a recorded reason. CEO remains read-only and has no access to payment details.
- [ ] Confirm payment records do not alter booking status, and confirming a booking does not create or complete a payment.
- [ ] Confirm QPay/online payment actions remain unavailable and `POST /api/payment/qpay-qr` returns `410`; no QR generation can change ledger state.

The application test suite validates synthetic arithmetic and statically checks route/migration guards. These do not replace the database permission, RPC, idempotency race, or audit-trigger checks above.

## Phase-four read-only CEO dashboard migration

The CEO dashboard migration follows the workspace roles, staff booking workflow, and payment-record migrations:

- **Existing database:** apply `supabase/ceo_business_dashboard_migration.sql` after the role, staff workflow, and payment-ledger migrations.
- **Empty test database:** follow the full sequence above, with the CEO migration followed by the customer ownership migration.
- Run only against an isolated non-production database. Do not apply migrations to production during this work.

The new CEO RPC returns aggregate values only. It rejects non-CEO callers and does not grant CEO `SELECT` on bookings, payment records, bed assignments, room blocks, or event tables. CEO direct data access remains read-only/denied; the API exposes only the aggregate RPC response. The migration adds status-event tracking from its installation onward and a payment-balance coverage marker for newly inserted bookings. It does not backfill historical status events or assume historical balances.

Dashboard definitions:

- Daily, monthly, annual, and custom dates use `Asia/Ulaanbaatar` calendar boundaries. The current month/year ends today when selected in progress. Comparison periods immediately precede the selected period and contain the same number of calendar days.
- Completed payments and completed refunds are period activity based on each record's `received_on` date. Pending bank transfers and requested refunds are excluded. Refunds appear on the date money was returned, even if the original receipt was in a different period. Net cash received is completed receipts less completed refunds; cash and bank subtotals are shown separately. Online payment is not connected and no online records are fabricated.
- Booking creation counts and booking value use the booking's Ulaanbaatar-local creation timestamp. Booking value is the current recorded agreed total for bookings created during the period and is not money received, profit, or accounting revenue.
- Cancellations/no-shows count status-change events written after this migration. Older transitions are not reconstructed; reports whose selected or comparison window predates the status-history start are marked incomplete.
- Occupancy is occupied bed-nights divided by eligible bed-nights. A bed-night is counted only from a recorded actual check-in until actual checkout or assignment release, using Ulaanbaatar calendar dates. Room-block nights are excluded from eligible capacity. A room with an overlapping unallocated legacy booking is excluded from eligible capacity; it is not guessed to be occupied or available, and the dashboard flags those bookings.
- Outstanding balances and overpayments are current/as-of-now totals only for bookings with complete payment-ledger coverage. Existing bookings without a coverage marker remain unknown and are excluded from both balances; their booking totals are never treated as payments or definite debts.
- CSV download contains only aggregates, period dates, trend totals, and data-completeness notes; it does not include client identifiers or payment references.

### CEO report checks for isolated test data

- [ ] Customer, staff, and manager accounts receive access denied from `/api/ceo/business-dashboard`; CEO receives aggregate JSON only. Direct CEO reads/writes of raw booking/payment/event tables are denied.
- [ ] Record synthetic cash and bank receipts with completion dates in different report periods from their booking dates; only completed records appear on their receipt dates. A completed refund in a later period reduces net cash only in the refund period.
- [ ] Confirm pending transfers and requested refunds do not affect completed receipt/refund totals. Confirm the pre-existing booking total is never included as a receipt.
- [ ] Check day, month, year (including leap year), and custom ranges around Ulaanbaatar midnight, month-end, year-end, and leap day. Verify the prior comparison spans the same number of calendar days.
- [ ] Compare positive, zero, and negative net activity against zero/non-zero baselines; the dashboard must label a zero prior baseline as new activity or both-zero, not produce an infinite percentage.
- [ ] Check occupancy with synthetic actual check-ins/checkouts, adjacent calendar days, room closures, and an unallocated legacy booking. Blocked/incomplete bed-nights must not enter the eligible denominator; booking counts are not used as occupancy.
- [ ] Compare on-screen totals with the CSV from the same filters and dates. Verify the report excludes names, phone numbers, booking references, and payment references.
- [ ] Force the RPC to fail and verify the UI displays an error, not zero totals. A successful empty period may display zero.

The local CEO tests cover date range resolution, timezone boundaries, comparisons, CSV consistency/privacy, and static server/migration guards. They do not execute SQL, validate Supabase RLS at runtime, or replace the isolated database checklist.

## Phase-five customer experience and booking ownership

The public `/booking` submission remains closed. The separate `/rooms/availability` page supports a non-reserving local/test preview only: clients choose Ulaanbaatar-valid dates, group size, and gender; inspect/select distinct available bed IDs within one room; see the room gender designation and limited current-occupancy details; and review the current database rate schedule. A selection does not hold a bed or create a booking. The availability API returns 404 in production regardless of `BED_AVAILABILITY_PREVIEW`, and remains disabled elsewhere unless that flag is explicitly enabled.

Public preview responses are built from `get_public_bed_availability(...)`, not booking rows, and contain public bed IDs, per-bed state, room gender designation, and current occupant gender plus scheduled-departure countdown only. Names, contacts, booking references, notes, and private booking IDs are excluded. The API requires a server-only service client. Do not enable the preview flag in production.

The `/profile` page reads bookings by `customer_user_id = auth.uid()` and the database applies the same ownership restriction. It no longer guesses ownership from an email address. `supabase/customer_booking_ownership_migration.sql` adds the ownership column and customer-select RLS policy, preserves all existing records without automatically claiming them by email, and provides manager-only `link_booking_to_customer(...)` with a required reason and audit record. Managers must verify the customer's identity out of band before linking; staff-created walk-in bookings remain unowned unless that verification occurs. Any future customer booking creator must set ownership from the authenticated user identity in a trusted server/database operation, never from a submitted user ID or email.

The public customer booking endpoint in this working copy remains closed, so there is no active customer booking creation path to attach ownership to. The staff booking RPC also leaves walk-in bookings unowned. Managers can use `/api/staff/bookings/link-customer` to call the existing audited link RPC only after identity verification; the endpoint requires manager access, an explicit `identityVerified: true` confirmation, booking/customer IDs, and a reason. Do not match accounts to bookings by name, phone, or email. The feedback migration adds a private customer-only table and a database RPC that accepts feedback only for the authenticated owner's `checked_out` booking. It stores one Room and one Service rating per booking, optional comment and stay snapshot; it does not write to public `reviews` or testimonials.

Read-only inspection of the currently hosted `www.semjidkhujirt.com` client on 2026-11-04 found it is not running this working copy's ownership flow: its profile filters bookings by the signed-in email, and its public booking page still posts to `/api/booking`. The client bundle also logs booking form data to the browser console. No booking was submitted and no production database was queried; this does not establish whether any particular customer booking was saved or linked. Treat the current live deployment as an older implementation until a separately approved deployment replaces it. The working copy remains closed to public booking.

The cancellation/refund policy, deposit requirements, payment timing, included treatment/meal package, and final price composition are not established in the current implementation. The customer pages disclose that these must be approved and confirmed; they do not invent terms. Existing room rates are displayed as the database's per-night catalogue by category, but do not claim a final group quote. QPay/online payment and production email delivery are not connected. Reception cash and staff-verified bank transfers are the only implemented payment-recording methods. Notification templates are bilingual where customer-facing, HTML-escaped, and tested through an in-memory capture transport. No production transport is bound and no message is sent.

### Migration and local settings

For an existing database, apply the six data-preserving phase migrations in this order after taking the normal backup:

1. `supabase/workspace_roles_migration.sql`
2. `supabase/staff_booking_workflow_migration.sql`
3. `supabase/payment_records_migration.sql`
4. `supabase/ceo_business_dashboard_migration.sql`
5. `supabase/customer_booking_ownership_migration.sql`
6. `supabase/customer_booking_feedback_migration.sql`

For an empty isolated test database, begin with `supabase/schema.sql` and `supabase/create_rooms_table.sql`, then use that same six-file order. `schema.sql` is destructive to existing tables and must not be used on a database with records. The feedback migration and verification SQL have been run in the isolated test project; do not apply them to production as part of this work.

On 2026-11-04, saved test evidence confirmed an actual synthetic completed-stay feedback submission, duplicate rejection, and a fresh-session read of both ratings. A follow-up check found two recorded synthetic customers missing their default customer role rows. Only those missing test role rows were restored, without overwriting existing assignments. Fresh-session checks through the local application API then passed: the owner sees the linked completed booking and saved ratings, duplicate submission returns 409, and another customer cannot submit or read that feedback. No new feedback row, real customer record, or production setting was changed by the follow-up checks. These API checks do not establish a completed browser visual review.

Environment setting names used by this working copy:

- Required for the local Supabase-backed app: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Server-only Supabase privileged operations and the local availability preview: `SUPABASE_SERVICE_ROLE_KEY`. Never use it in a browser, expose it with a `NEXT_PUBLIC_` prefix, or include its value in chat/logs.
- Optional site metadata: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- Local/non-production preview opt-in only: `BED_AVAILABILITY_PREVIEW`. The production API guard always returns 404.
- No email-sending environment variable is currently consumed by the booking/notification code; set up and verify an approved provider, sender domain, and staff recipient only in a later notification-delivery task. No payment-provider setting is required because QPay is not connected.

### Prioritized end-to-end checklist

Run this checklist only after the isolated test database has the migrations above and synthetic accounts/records. Never use real client records or the service-role key as a signed-in test user.

- [ ] **Signed out/customer UI:** check `/booking` closure and `/rooms/availability` behavior with preview disabled. In the isolated preview, test date changes, invalid dates, one- and multi-bed selection, gender restrictions, current occupancy countdown, unavailable/error states, keyboard-only bed selection, narrow mobile width, and both Mongolian and English. Verify selections never reserve beds and no private fields appear in network responses.
- [ ] **Customer ownership/privacy:** create two synthetic customers and synthetic linked/unlinked bookings. A customer sees only rows whose `customer_user_id` is their own auth user ID; changing email or guessing another booking reference grants nothing. Direct booking-table reads return only owned rows, and booking writes, role changes, payment reads, staff endpoints, and CEO reports are denied. Confirm legacy unlinked rows remain invisible until a manager verifies and links them.
- [ ] **Private feedback:** on the isolated database, verify a customer can submit one room/service rating only for their own `checked_out` booking. Pending, confirmed, in-house, cancelled, unlinked, and another customer's bookings must be rejected; direct inserts/updates/deletes and anonymous, staff, and CEO reads must be denied. Duplicate submissions must fail even when simultaneous. Confirm a refresh shows only that customer's saved feedback and it never appears in public testimonials.
- [ ] **Staff operations:** staff can search synthetic bookings, assign/change specific beds, record actual check-in/out, create walk-in bookings, and block rooms. Test capacity, concurrent same-bed conflicts, same-gender room rules, and audit history. Staff cannot link customer ownership, change pricing/settings, finalize refunds, or change roles.
- [ ] **Manager operations:** manager-only pricing/settings writes and verified customer-link RPC succeed; an invalid role, missing reason, wrong booking/account, customer/staff direct mutation, and unaudited direct assignment fail. Confirm each customer link appears in the audit history.
- [ ] **Payment reception:** record cash, pending and completed bank transfers, deposits, duplicate idempotency keys, overpayments, requested refunds, and manager-completed partial refunds. Verify booking state remains independent of payment state and ledger changes are attributable. QPay and online payment remain unavailable.
- [ ] **CEO read-only reports:** verify daily/month/year/custom filters, Ulaanbaatar boundaries, completed receipt/refund dates, balances, bed-night occupancy, prior-period comparisons, incomplete-data warnings, and CSV equality. CEO raw booking/client/payment reads and every write must be denied; the aggregate endpoint returns no private rows.
- [ ] **Failure and notifications:** force the database/RPC offline and confirm errors never appear as zero or successful booking/payment. Run the notification tests using the in-memory capture transport; verify the customer notice says pending, the staff notice requests review, HTML input is escaped, and no outbound provider call occurs.
- [ ] **Before public reopening:** rerun the checklist after provider setup, obtain owner approval for cancellation/refund, deposits/payment timing, package inclusions and final pricing, and separately authorize production preview/submission and notification delivery. This phase does not reopen bookings.

Locally available commands after a clean dependency install are `npm run build`, `npm run typecheck`, `npm run lint`, and `npm test`. The focused suite uses synthetic data and does not connect to Supabase.

## Current bookings and payment data

- Existing admin accounts stay at `customer` until individually verified and assigned as above.
- The public booking form and booking creation API remain closed; the booking API returns `410 Gone`.
- Existing booking `total` and `payment` fields are unverified booking declarations, not evidence of money received. Staff can inspect individual booking entries with that warning. The CEO workspace does not display those amounts or call them revenue.
- The CEO dashboard reports only the limited aggregate activity defined above. Expenses, profit, accounting revenue recognition, provider payments, and a final accounting close remain out of scope. The dashboard does not reopen public booking or claim that booking values are verified receipts.
