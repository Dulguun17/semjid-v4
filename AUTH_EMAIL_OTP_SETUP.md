# Customer sign-in and email-code verification

Implemented locally on 10 November 2026. The design uses Semjid’s existing logo and landscape image, with responsive English/Mongolian forms and light/dark themes. Phone remains an optional profile contact field. Verification uses email.

## Rollout setting

`CUSTOMER_EMAIL_OTP_ENABLED` defaults to `false`. The redesigned pages then offer password login and the existing signup confirmation-link behavior. Password login is also available when email codes are enabled.

With `CUSTOMER_EMAIL_OTP_ENABLED=true`, login offers email codes for existing accounts. Signup creates the password-based account through the existing bounded API, then asks for the confirmation code. Both code flows use Supabase `verifyOtp` with `type: "email"`. Navigation requires the returned session and the SDK’s current session to match the submitted email and user ID. Supabase owns code validation, expiry, session creation and session persistence. The application keeps the pending email, password and code in component memory. A page reload starts a fresh form.

The signup API checks the provider’s read-only `/auth/v1/settings` endpoint before account creation. It requires the email provider to be enabled and `mailer_autoconfirm=false`. Unavailable or unexpected settings produce a setup error. The temporary client attempts to revoke an unexpected session returned during signup and returns a setup error while withholding tokens from the browser. The API keeps its request-size, field-length and password checks and returns bounded public responses.

## Provider setup by the account owner

Perform these steps in the isolated Supabase project before enabling the flag there.

1. In **Authentication → Sign In / Providers → Email**, enable email authentication and require **Confirm email**. Confirm that email codes contain six digits. Review the configured OTP expiry and resend limits. Supabase enforces those limits. The UI provides a 60-second resend wait. [Email OTP documentation](https://supabase.com/docs/guides/auth/auth-email-passwordless)
2. In **Authentication → Email Templates**, add `{{ .Token }}` to both **Confirm signup** and **Magic Link**. Signup uses the first template. Existing-account code login uses the second. Preserve the existing confirmation links during the transition so current confirmation-link users can continue. The template variables are expanded by Supabase. [Email template documentation](https://supabase.com/docs/guides/auth/auth-email-templates)

   Example **Confirm signup** body

   ```html
   <h2>Сэмжид Хужирт · Semjid Khujirt</h2>
   <p>И-мэйл хаягаа баталгаажуулах код · Your email confirmation code</p>
   <p style="font-size:28px;letter-spacing:6px">{{ .Token }}</p>
   <p>Кодоо Сэмжидийн бүртгэлийн хуудсанд оруулна уу.<br>
   Enter this code on the Semjid signup page.</p>
   <p><a href="{{ .ConfirmationURL }}">И-мэйл баталгаажуулах · Confirm email</a></p>
   ```

   Example **Magic Link** body

   ```html
   <h2>Сэмжид Хужирт · Semjid Khujirt</h2>
   <p>Нэвтрэх код · Your sign-in code</p>
   <p style="font-size:28px;letter-spacing:6px">{{ .Token }}</p>
   <p>Кодоо Сэмжидийн нэвтрэх хуудсанд оруулна уу.<br>
   Enter this code on the Semjid sign-in page.</p>
   <p><a href="{{ .ConfirmationURL }}">Нэвтрэх · Sign in</a></p>
   ```

3. Configure **Authentication → Email / SMTP settings** with an approved, verified sender and a working SMTP provider. Enter provider credentials through the dashboard’s secure fields. Supabase’s default mail service has recipient and rate restrictions, so use a controlled test inbox allowed by the configured transport. These auth messages use the Supabase Auth email transport. Booking notifications have separate delivery configuration. [SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp)
4. Review **Authentication → URL Configuration** for the isolated local/staging origins and the existing confirmation-link fallback. Set the intended Site URL and allowed redirect URLs. The numeric-code flow returns through the existing validated same-site booking continuation. [Redirect URL documentation](https://supabase.com/docs/guides/auth/redirect-urls)
5. Test signup with a new synthetic account and a controlled inbox, then test an existing account’s code login, wrong/expired codes, resend, password login, profile metadata and booking continuation. Verify delivery and actual session/booking access in the isolated project. Enable the app flag after those checks succeed. Keep credentials, email contents and customer records out of reports.

The read-only settings check is documented in the [official Auth API specification](https://github.com/supabase/auth/blob/master/openapi.yaml). SMTP readiness, template content and delivery still need account-owner verification.

## Local preview

Run the regular preview for the redesigned password/confirmation-link flow.

```sh
npm run dev -- --port 3000
```

After the isolated provider setup, start the same app with email codes enabled.

```sh
CUSTOMER_EMAIL_OTP_ENABLED=true npm run dev -- --port 3000
```

Open [customer login](http://localhost:3000/login) or [customer signup](http://localhost:3000/signup). The shared theme/language controls are in the navigation. The booking continuation is retained through the `redirect` query parameter. Pending emails, passwords and codes are kept out of URLs and browser drafts.

The existing [staff/CEO sign-in](http://localhost:3000/admin/login) continues to use its own page and role checks. The customer-auth pages suppress the floating chat widget to keep form actions clear.

## Confirmation-link compatibility

The consolidated `/auth/callback` page completes confirmation links with the existing browser Supabase client, keeping PKCE verifiers and resulting sessions in the same browser storage as sign-in. It supports email/signup token hashes, PKCE codes and implicit email session fragments. The callback removes credentials from the address bar before continuing and uses fixed confirmation/error destinations. Recovery and email-change links require their own flows and are rejected here. Public errors never display provider details from query parameters.

`/auth/confirmed` and `/auth/error` retain the bilingual confirmation screens from the earlier worktree. Auth pages remain excluded from indexing. Configure any confirmation-link redirect to `/auth/callback` in the isolated project's allowed URLs before testing. A PKCE link must be opened in the browser that initiated it.

## Files

| Files | Purpose |
| --- | --- |
| `src/app/login/page.tsx`, `src/app/signup/page.tsx` | Server-controlled rollout flag and shared auth screen |
| `src/components/auth/CustomerAuth.tsx` | Signup, password login, code request/verification/resend, session checks and continuation |
| `src/components/auth/AuthShell.tsx`, `src/components/auth/CustomerAuth.module.css`, `src/components/auth/auth-copy.ts` | Semjid layout, responsive themes and bilingual copy |
| `src/components/auth/EmailCodeInput.tsx` | Single labeled six-digit input with native keyboard, paste and autofill support |
| `src/lib/customer-auth.ts` | Email/code normalization, matching-session checks and bounded error categories |
| `src/lib/email-otp-config.ts` | Read-only provider confirmation guard |
| `src/app/api/auth/signup/route.ts` | Existing signup protections plus gated confirmation guard and safe responses |
| `src/components/ui/ChatWidget.tsx` | Hide/pause chat on customer auth pages while preserving its existing behavior elsewhere |
| `.env.example`, `package.json`, `tests/customer-auth.test.mjs` | Rollout example and regression coverage |

## Verification record

- All 57 automated tests passed, including eight new auth tests for input limits, confirmation settings, an auto-confirm race, legacy compatibility, safe errors, normalization and matching sessions.
- Full lint, TypeScript typecheck and the production build passed. The build used synthetic Supabase configuration and disabled analytics.
- Twenty-four visual combinations passed at 375px and 1440px widths across login, signup and code entry, both languages and both themes. Checks included horizontal overflow, field labels, sampled solid-colour text contrast and runtime errors. The final landscape layout and mobile code screen were visually inspected. This was a focused UI review.
- Thirty-six flow checks passed for existing-account code requests, invalid/expired/incomplete codes, focus recovery, paste/autofill attributes, keyboard editing, resend cooldown, email correction, missing-session rejection, signup verification, profile metadata, password login, reload privacy and safe booking continuation.
- Eighteen compiled production-preview checks passed for enabled/disabled rollout behavior, busy/duplicate submission, provider rate limits, password login, legacy signup handoff and runtime/endpoint errors. Four compiled auth-page responses retained noindex headers and POST forms. Invalid and oversized signup requests returned 400 and 413 before provider access.
- Browser checks exercised installed `@supabase/supabase-js` and `@supabase/auth-js` version 2.102.1 with synthetic intercepted responses, including the SDK’s session storage and the existing profile/booking pages. Remote requests were intercepted or blocked. Browser fixtures and screenshots were kept outside the repository.
- Real email delivery, current isolated-project template/settings state and actual isolated-project account creation still require controlled provider verification. The app rollout flag remains opt-in. Credentials and customer records are excluded from this report.
