import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { NextResponse } = require("next/server");

function load(path, overrides = {}) {
  const source = fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", output)(name => {
    if (name in overrides) return overrides[name];
    if (name === "server-only") return {};
    return require(name);
  }, loaded, loaded.exports);
  return loaded.exports;
}

const customerAuth = load("src/lib/customer-auth.ts");
const validation = load("src/lib/request-validation.ts");
const otpConfig = load("src/lib/email-otp-config.ts");
const { completeAuthCallback } = load("src/lib/auth-callback.ts");

function callbackAuth(result) {
  const calls = [];
  const auth = Object.fromEntries(["exchangeCodeForSession", "verifyOtp", "setSession"].map(method => [method, async input => {
    calls.push({ method, input });
    if (result instanceof Error) throw result;
    return result;
  }]));
  return { auth, calls };
}

const confirmedCallback = {
  data: { user: { id: "synthetic-owner" }, session: { access_token: "synthetic-access", user: { id: "synthetic-owner" } } },
  error: null,
};

test("email confirmation callbacks verify allowed token types through the browser auth client", async () => {
  for (const type of ["email", "signup", "magiclink"]) {
    const { auth, calls } = callbackAuth(confirmedCallback);
    assert.equal(await completeAuthCallback(auth, new URL(`https://example.test/auth/callback?token_hash=synthetic-hash&type=${type}`)), true);
    assert.deepEqual(calls, [{ method: "verifyOtp", input: { token_hash: "synthetic-hash", type } }]);
  }
});

test("PKCE and implicit email callbacks establish a session in the existing browser client", async () => {
  const pkce = callbackAuth(confirmedCallback);
  assert.equal(await completeAuthCallback(pkce.auth, new URL("https://example.test/auth/callback?code=synthetic-code&next=https://elsewhere.test")), true);
  assert.deepEqual(pkce.calls, [{ method: "exchangeCodeForSession", input: "synthetic-code" }]);
  const implicit = callbackAuth(confirmedCallback);
  assert.equal(await completeAuthCallback(implicit.auth, new URL("https://example.test/auth/callback#access_token=synthetic-access&refresh_token=synthetic-refresh&type=signup")), true);
  assert.deepEqual(implicit.calls, [{ method: "setSession", input: { access_token: "synthetic-access", refresh_token: "synthetic-refresh" } }]);
});

test("invalid, mixed, failed and unsupported confirmation links cannot reuse an existing session", async () => {
  const { auth, calls } = callbackAuth(confirmedCallback);
  for (const suffix of [
    "", "?next=/profile", "?token_hash=synthetic-hash", "?token_hash=synthetic-hash&type=recovery",
    "?token_hash=synthetic-hash&type=email_change", "?code=synthetic-code&token_hash=synthetic-hash&type=email",
    "?code=synthetic-code&error=access_denied", "?code=synthetic-code#error_description=private-detail",
    "#access_token=synthetic-access", "#access_token=synthetic-access&refresh_token=synthetic-refresh&type=recovery",
    `?code=${"x".repeat(4097)}`,
  ]) assert.equal(await completeAuthCallback(auth, new URL(`https://example.test/auth/callback${suffix}`)), false);
  assert.deepEqual(calls, []);
});

test("confirmation success requires a provider-verified matching user and session", async () => {
  for (const result of [
    { data: { user: null, session: null }, error: null },
    { ...confirmedCallback, error: { message: "synthetic-private-provider-detail" } },
    { data: { user: { id: "other-owner" }, session: confirmedCallback.data.session }, error: null },
    new Error("synthetic-private-provider-detail"),
  ]) {
    const { auth } = callbackAuth(result);
    assert.equal(await completeAuthCallback(auth, new URL("https://example.test/auth/callback?code=synthetic-code")), false);
  }
});

function configureTest(context, enabled = "true") {
  const names = ["CUSTOMER_EMAIL_OTP_ENABLED", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const previousFetch = globalThis.fetch;
  process.env.CUSTOMER_EMAIL_OTP_ENABLED = enabled;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://synthetic.example.test";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "synthetic-anon-key";
  context.after(() => {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
    globalThis.fetch = previousFetch;
  });
}

const input = { email: "Synthetic@Example.test", password: "SyntheticPass123", firstName: "Synthetic", lastName: "Preview", phone: "00000000" };
const request = (body = input) => new Request("http://localhost/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

function signupRoute({ autoConfirm = false, session = null, error = null } = {}) {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://synthetic.example.test/auth/v1/settings");
    assert.equal(options.cache, "no-store");
    assert.equal(options.headers.apikey, "synthetic-anon-key");
    calls.push("settings");
    return Response.json({ mailer_autoconfirm: autoConfirm, external: { email: true } });
  };
  const route = load("src/app/api/auth/signup/route.ts", {
    "next/server": { NextResponse },
    "@/lib/request-validation": validation,
    "@/lib/customer-auth": customerAuth,
    "@/lib/email-otp-config": otpConfig,
    "@supabase/supabase-js": {
      createClient: (_url, key, options) => {
        assert.equal(key, "synthetic-anon-key");
        assert.equal(options.auth.persistSession, false);
        assert.equal(options.auth.autoRefreshToken, false);
        return { auth: {
          signUp: async details => { calls.push(details); return { data: { session }, error }; },
          signOut: async options => { calls.push(options); return { error: null }; },
        } };
      },
    },
  });
  return { route, calls };
}

test("email/code normalization and session checks cannot fabricate a verified login", () => {
  assert.equal(customerAuth.normalizeEmail(" Synthetic@Example.test "), "synthetic@example.test");
  assert.equal(customerAuth.normalizeEmailCode("12 34-56 extra"), "123456");
  assert.equal(customerAuth.normalizeEmailCode("abc"), "");
  const session = { access_token: "synthetic-token", user: { id: "synthetic-owner", email: "synthetic@example.test" } };
  assert.equal(customerAuth.matchingAuthSession(session, input.email), true);
  for (const candidate of [null, { ...session, access_token: "" }, { ...session, user: { id: "", email: session.user.email } }]) {
    assert.equal(customerAuth.matchingAuthSession(candidate, input.email), false);
  }
  assert.equal(customerAuth.matchingAuthSession(session, "other@example.test"), false);
  assert.equal(customerAuth.authProblem({ message: "private provider detail" }, "verify"), "verify");
  assert.equal(customerAuth.authProblem({ code: "otp_expired" }, "verify"), "expired");
  assert.equal(customerAuth.authProblem({ status: 429 }, "send"), "rateLimit");
});

test("OTP signup refuses auto-confirm before creating an account", async context => {
  configureTest(context);
  const { route, calls } = signupRoute({ autoConfirm: true });
  const response = await route.POST(request());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "otp_setup_required");
  assert.deepEqual(calls, ["settings"]);
});

test("OTP signup fails closed for missing, disabled and unreachable email settings", async context => {
  configureTest(context);
  for (const settings of [{}, { mailer_autoconfirm: false }, { mailer_autoconfirm: false, external: { email: false } }]) {
    globalThis.fetch = async () => Response.json(settings);
    assert.equal(await otpConfig.emailConfirmationRequired(), false);
  }
  globalThis.fetch = async () => { throw new Error("Synthetic transport failure"); };
  assert.equal(await otpConfig.emailConfirmationRequired(), false);
});

test("confirmed-email signup keeps metadata bounded and returns a code challenge without a session", async context => {
  configureTest(context);
  const { route, calls } = signupRoute();
  const response = await route.POST(request({ ...input, role: "ceo", email_confirm: true }));
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  const result = await response.json();
  assert.equal(result.verification, "email_otp");
  assert.equal(result.confirmationRequired, true);
  assert.deepEqual(calls[1], {
    email: "synthetic@example.test", password: input.password,
    options: { data: { first_name: "Synthetic", last_name: "Preview", phone: "00000000" } },
  });
  assert.equal(JSON.stringify(result).includes("synthetic"), false);
});

test("a signup settings race cannot expose an auto-confirmed session as OTP verification", async context => {
  configureTest(context);
  const { route, calls } = signupRoute({ session: { access_token: "synthetic-private-session" } });
  const response = await route.POST(request());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "otp_setup_required");
  assert.deepEqual(calls.at(-1), { scope: "local" });
});

test("the disabled rollout preserves legacy signup and never serializes auth tokens", async context => {
  configureTest(context, "false");
  const { route, calls } = signupRoute({ autoConfirm: true, session: { access_token: "synthetic-private-session" } });
  const response = await route.POST(request());
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.confirmationRequired, false);
  assert.equal(result.verification, "email_link");
  assert.equal(JSON.stringify(result).includes("synthetic-private"), false);
  assert.equal(calls.includes("settings"), false);
});

test("signup validation rejects oversize and invalid data before provider access", async context => {
  configureTest(context);
  const { route, calls } = signupRoute();
  for (const body of [
    { ...input, email: "invalid" },
    { ...input, password: "weak" },
    { ...input, password: "lettersOnly" },
    { ...input, firstName: "x".repeat(101) },
    { ...input, phone: "0".repeat(31) },
  ]) assert.equal((await route.POST(request(body))).status, 400);
  assert.equal((await route.POST(request({ ...input, extra: "x".repeat(17000) }))).status, 413);
  assert.deepEqual(calls, []);
});

test("signup provider rate limits survive the API boundary without raw errors", async context => {
  configureTest(context);
  const originalLog = console.error;
  const logs = [];
  console.error = (...args) => logs.push(args);
  context.after(() => { console.error = originalLog; });
  const { route } = signupRoute({ error: { status: 429, code: "over_email_send_rate_limit", message: "synthetic-private-provider-detail" } });
  const response = await route.POST(request());
  assert.equal(response.status, 429);
  assert.equal(JSON.stringify(await response.json()).includes("synthetic-private"), false);
  assert.equal(JSON.stringify(logs).includes("synthetic-private"), false);
});
