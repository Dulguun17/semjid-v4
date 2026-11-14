import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";
import { randomUUID } from "node:crypto";

function load(path) {
  const source = fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", output)(name => {
    if (name === "server-only") return {};
    throw new Error(`Unexpected dependency ${name}`);
  }, loaded, loaded.exports);
  return loaded.exports;
}
const consent = load("src/lib/analytics-consent.ts");
const validation = load("src/lib/request-validation.ts");

test("consent defaults to off and persists only the current version and boolean", () => {
  for (const raw of [null, "broken", "{}", '{"version":0,"analytics":true}', '{"version":1,"analytics":"yes"}']) assert.equal(consent.parseConsent(raw), null);
  assert.deepEqual(consent.parseConsent('{"version":1,"analytics":true,"email":"synthetic@example.test"}'), { version: 1, analytics: true });
});

test("analytics accepts exact marketing paths and valid measurement IDs only", () => {
  for (const path of ["/admin", "/admin/ceo", "/profile", "/booking", "/booking/summary", "/booking/confirmation", "/rooms/availability", "/login", "/signup", "/rooms?bookingId=synthetic", "/rooms#synthetic", "/unknown", "__proto__"]) assert.equal(consent.marketingPath(path), null);
  assert.equal(consent.marketingPath("/rooms"), "/rooms");
  assert.equal(consent.validMeasurementId("G-TEST000001"), "G-TEST000001");
  assert.equal(consent.validMeasurementId('G-TEST\"><script>'), null);
});

test("isolated tag queues only sanitized page views and ignores forged or private messages", () => {
  const html = consent.analyticsFrameDocument("G-TEST000001", "https://example.test");
  const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
  let receive;
  const acknowledgements = [];
  const parent = { postMessage: message => acknowledgements.push(message) };
  const context = { parent, crypto: { randomUUID }, Date, window: { addEventListener: (_name, callback) => { receive = callback; } }, document: { querySelector: () => null, createElement: () => ({}), head: { appendChild: () => {} } } };
  context.window.dataLayer = [];
  Object.defineProperty(context, "dataLayer", { get: () => context.window.dataLayer });
  vm.runInNewContext(script, context);
  const send = (path, source = parent, origin = "https://example.test") => receive({ source, origin, data: { path, email: "synthetic@example.test" } });
  send("/rooms", {}, "https://attacker.test"); send("/booking/summary"); send("/rooms?name=synthetic");
  assert.equal(context.window.dataLayer.length, 0);
  send("/rooms"); send("/rooms"); send("/about");
  const commands = context.window.dataLayer.map(value => Array.from(value));
  const config = commands.find(value => value[0] === "config")[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  assert.equal(commands.filter(value => value[0] === "event").length, 2);
  assert.equal(commands[0][2].ad_user_data, "denied");
  const recorded = JSON.stringify(commands);
  assert.doesNotMatch(recorded, /synthetic@example|booking|user_id|\?name|#synthetic/);
  assert.match(recorded, /https:\/\/example.test\/rooms/);
  receive({ source: parent, origin: "https://example.test", data: { type: "stop" } });
  assert.equal(context.window["ga-disable-G-TEST000001"], true);
  assert.equal(acknowledgements.length, 1);
  send("/rooms");
  assert.equal(context.window.dataLayer.length, 0);
});

test("JSON request bounds apply to streaming bodies without content-length", async () => {
  const request = new Request("http://localhost/api/reviews", { method: "POST", body: JSON.stringify({ comment: "x".repeat(17000) }) });
  await assert.rejects(validation.readJsonObject(request), error => error.status === 413);
  for (const body of ["[]", "null", "broken"]) await assert.rejects(validation.readJsonObject(new Request("http://localhost/api/reviews", { method: "POST", body })), error => error.status === 400);
});

test("uploads reject active content, spoofed images and unsupported MIME types", () => {
  const bytes = value => new TextEncoder().encode(value);
  for (const mime of ["image/svg+xml", "text/html", "application/javascript", "application/octet-stream"]) assert.throws(() => validation.validateUpload(bytes("<script>"), mime));
  assert.throws(() => validation.validateUpload(bytes("not an image"), "image/png", true));
  assert.throws(() => validation.validateUpload(bytes("%PDF-1.4"), "application/pdf", true));
  assert.equal(validation.validateUpload(bytes("%PDF-1.4"), "application/pdf"), "pdf");
  assert.equal(validation.validateUpload(Uint8Array.from([255, 216, 255, 0]), "image/jpeg", true), "jpg");
});


test("public booking copy directs bank transfers to reception without account details", () => {
  const { t } = load("src/lib/data.ts");
  assert.match(t.booking.bankAcc.en, /reception/i);
  assert.match(t.booking.bankAcc.mn, /хүлээн авалт/);
  assert.doesNotMatch(JSON.stringify(t.booking), /(?:\d[ \t-]*){10,}/);
});

test("indexing requires a configured production origin and private pages stay outside the sitemap", () => {
  const site = load("src/lib/site-metadata.ts");
  for (const url of ["", "http://localhost:3000", "https://localhost", "https://127.0.0.1", "https://user:password@example.test", "https://example.test/path", "https://example.test/?customer=synthetic"]) assert.equal(site.canonicalSiteOrigin(url), null);
  assert.equal(site.canonicalSiteOrigin("https://semjid.example/"), "https://semjid.example");
  assert.equal(site.publicIndexingEnabled({ NODE_ENV: "production", VERCEL_ENV: "preview", NEXT_PUBLIC_SITE_URL: "https://semjid.example" }), false);
  assert.equal(site.publicIndexingEnabled({ NODE_ENV: "production", VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://semjid.example" }), true);
  for (const path of ["/admin", "/profile", "/booking", "/booking/confirmation", "/login", "/signup"]) assert.equal(Object.hasOwn(site.PAGE_DETAILS, path), false);
  assert.equal(site.PRIVATE_PAGE_METADATA.robots.index, false);
  assert.ok(Object.values(site.PAGE_DETAILS).every(page => page.description.length > 50));
});

test("theme bootstraps before hydration, follows system and tolerates blocked storage", () => {
  const { THEME_BOOTSTRAP_SCRIPT, parseTheme } = load("src/lib/theme.ts");
  assert.equal(parseTheme("untrusted"), "system");
  for (const [preference, systemDark, expected, blocked] of [["light", true, false, false], ["dark", false, true, false], ["system", true, true, false], ["invalid", false, false, false], [null, true, true, true]]) {
    let dark;
    const root = { classList: { toggle: (name, value) => { assert.equal(name, "dark"); dark = value; } }, style: {} };
    vm.runInNewContext(THEME_BOOTSTRAP_SCRIPT, { localStorage: { getItem: key => { assert.equal(key, "semjid:theme"); if (blocked) throw new Error("Storage blocked"); return preference; } }, matchMedia: () => ({ matches: systemDark }), document: { documentElement: root } });
    assert.equal(dark, expected);
    assert.equal(root.style.colorScheme, expected ? "dark" : "light");
  }
});
