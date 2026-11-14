"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, CalendarDays, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/lang-context";
import { safeInternalRedirect } from "@/lib/auth-navigation";
import { authProblem, EMAIL_CODE_COOLDOWN_SECONDS, matchingAuthSession, normalizeEmail, type AuthProblem } from "@/lib/customer-auth";
import { AuthShell } from "./AuthShell";
import { EmailCodeInput } from "./EmailCodeInput";
import { authCopy } from "./auth-copy";
import styles from "./CustomerAuth.module.css";

type AuthMode = "login" | "signup";
type Challenge = { email: string; purpose: AuthMode };

function PasswordField({ id, label, value, onChange, newPassword, hint }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  newPassword: boolean;
  hint?: string;
}) {
  const { lang } = useLang();
  const copy = authCopy[lang];
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.passwordWrap}>
        <input id={id} name={id} className={styles.input} type={visible ? "text" : "password"}
          autoComplete={newPassword ? "new-password" : "current-password"}
          minLength={newPassword ? 8 : undefined} maxLength={newPassword ? 128 : undefined}
          required value={value} aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={event => onChange(event.target.value)} />
        <button type="button" aria-label={visible ? copy.hidePassword : copy.showPassword} aria-pressed={visible} onClick={() => setVisible(!visible)}>
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      {hint && <p className={styles.hint} id={`${id}-hint`}>{hint}</p>}
    </div>
  );
}

export function CustomerAuth({ mode, emailOtpEnabled }: { mode: AuthMode; emailOtpEnabled: boolean }) {
  const { lang } = useLang();
  const copy = authCopy[lang];
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeInternalRedirect(searchParams.get("redirect"));
  const redirectQuery = redirectTo !== "/profile" ? `?redirect=${encodeURIComponent(redirectTo)}` : "";
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "", phone: "" });
  const [method, setMethod] = useState<"code" | "password">(emailOtpEnabled ? "code" : "password");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [confirmationRequired, setConfirmationRequired] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [problem, setProblem] = useState<AuthProblem | null>(null);
  const [notice, setNotice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const emailInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!resendAt) return;
    const update = () => setRemaining(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  const change = (field: keyof typeof form, value: string) => {
    setForm(previous => ({ ...previous, [field]: value }));
    setProblem(null);
  };

  const run = async (action: () => Promise<void>, fallback: AuthProblem) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setProblem(null);
    setNotice(false);
    try {
      await action();
    } catch (error) {
      if (mounted.current) {
        const nextProblem = authProblem(error, fallback);
        setProblem(nextProblem);
        if (nextProblem === "rateLimit") setResendAt(Date.now() + EMAIL_CODE_COOLDOWN_SECONDS * 1000);
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const completeSignIn = async (session: Session | null, email: string) => {
    if (!matchingAuthSession(session, email)) {
      if (mounted.current) setProblem("session");
      return;
    }
    const { data, error } = await supabase.auth.getSession();
    if (!mounted.current) return;
    if (error || !matchingAuthSession(data.session, email) || data.session?.user.id !== session?.user.id) {
      setProblem("session");
      return;
    }
    router.replace(redirectTo);
    router.refresh();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    const email = normalizeEmail(form.email);
    if (mode === "signup") {
      if (form.password !== form.confirmPassword) { setProblem("passwordMismatch"); return; }
      if (form.password.length < 8 || form.password.length > 128 || !/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
        setProblem("passwordStrength");
        return;
      }
      if (emailOtpEnabled && Date.now() < resendAt) return;
      await run(async () => {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: form.password, firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim() }),
        });
        const result = await response.json();
        if (!response.ok) throw { code: result.code, status: response.status };
        if (!mounted.current) return;
        setForm(previous => ({ ...previous, email, password: "", confirmPassword: "" }));
        if (emailOtpEnabled && result.verification === "email_otp" && result.confirmationRequired === true) {
          setChallenge({ email, purpose: "signup" });
          setResendAt(Date.now() + EMAIL_CODE_COOLDOWN_SECONDS * 1000);
        } else {
          setConfirmationRequired(result.confirmationRequired !== false);
        }
      }, "signup");
      return;
    }
    if (method === "password") {
      await run(async () => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: form.password });
        if (mounted.current) setForm(previous => ({ ...previous, password: "" }));
        if (error) throw error;
        await completeSignIn(data.session, email);
      }, "credentials");
      return;
    }
    if (Date.now() < resendAt) return;
    await run(async () => {
      setResendAt(Date.now() + EMAIL_CODE_COOLDOWN_SECONDS * 1000);
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (error) throw error;
      if (mounted.current) setChallenge({ email, purpose: "login" });
    }, "send");
  };

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!challenge || inFlight.current) return;
    if (!/^[0-9]{6}$/.test(code)) { setProblem("sixDigits"); return; }
    await run(async () => {
      try {
        const { data, error } = await supabase.auth.verifyOtp({ email: challenge.email, token: code, type: "email" });
        if (error) throw error;
        await completeSignIn(data.session, challenge.email);
      } finally {
        if (mounted.current) setCode("");
      }
    }, "verify");
  };

  const resend = async () => {
    if (!challenge || Date.now() < resendAt || inFlight.current) return;
    await run(async () => {
      setResendAt(Date.now() + EMAIL_CODE_COOLDOWN_SECONDS * 1000);
      setCode("");
      const { error } = challenge.purpose === "signup"
        ? await supabase.auth.resend({ type: "signup", email: challenge.email })
        : await supabase.auth.signInWithOtp({ email: challenge.email, options: { shouldCreateUser: false } });
      if (error) throw error;
      if (mounted.current) setNotice(true);
    }, "send");
  };

  const correctEmail = () => {
    if (inFlight.current) return;
    setChallenge(null);
    setCode("");
    setProblem(null);
    setNotice(false);
    window.requestAnimationFrame(() => emailInput.current?.focus());
  };

  const legacyConfirmation = confirmationRequired !== null;
  const title = challenge ? copy.codeTitle : legacyConfirmation
    ? (confirmationRequired ? copy.linkConfirmationTitle : copy.accountReadyTitle)
    : (mode === "signup" ? copy.signupTitle : copy.loginTitle);
  const countdown = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  const waitingToSend = remaining > 0 && (mode === "signup" ? emailOtpEnabled : method === "code");

  return (
    <AuthShell>
      <header className={styles.heading}>
        {(challenge || legacyConfirmation) && <div className={styles.mailIcon}><MailCheck size={26} aria-hidden="true" /></div>}
        <span className={styles.eyebrow}>{copy.account}</span>
        <h1 id="auth-title">{title}</h1>
        {challenge ? <p>{copy.codeBody}<strong className={styles.emailSummary}>{challenge.email}</strong></p>
          : <p>{legacyConfirmation ? (confirmationRequired ? copy.linkConfirmationBody : copy.accountReadyBody) : (mode === "signup" ? copy.signupBody : copy.loginBody)}</p>}
      </header>
      {problem && <div id="auth-error" className={styles.error} role="alert"><AlertCircle size={17} aria-hidden="true" /><span>{copy.errors[problem]}</span></div>}
      {notice && <p className={styles.status} role="status">{copy.resendNotice}</p>}
      {challenge ? (
        <form method="post" onSubmit={verify} aria-labelledby="auth-title" aria-busy={busy} noValidate>
          <EmailCodeInput value={code} onChange={value => { setCode(value); setProblem(null); }} label={copy.codeLabel} disabled={busy} invalid={!!problem} describedBy={`auth-code-help${problem ? " auth-error" : ""}`} />
          <p className={styles.hint} id="auth-code-help">{copy.codeHelp}</p>
          <button className={`${styles.primary} ${styles.submitSpace}`} type="submit" disabled={busy}>
            {busy ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
            {busy ? copy.verifying : copy.verify}
          </button>
          <div className={styles.codeActions}>
            <button type="button" className={styles.textButton} disabled={busy || remaining > 0} onClick={() => void resend()}>
              {remaining > 0 ? `${copy.resendIn} ${countdown}` : copy.resend}
            </button>
            <button type="button" className={styles.textButton} disabled={busy} onClick={correctEmail}>{copy.changeEmail}</button>
          </div>
        </form>
      ) : legacyConfirmation ? (
        <Link className={styles.primary} href={`/login${redirectQuery}`}>{copy.signIn}<ArrowRight size={17} aria-hidden="true" /></Link>
      ) : (
        <>
          {mode === "login" && emailOtpEnabled && <div className={styles.method} role="group" aria-label={copy.methodLabel}>
            {(["code", "password"] as const).map(value => (
              <button key={value} type="button" disabled={busy} aria-pressed={method === value} onClick={() => { setMethod(value); setProblem(null); setForm(previous => ({ ...previous, password: "" })); }}>
                {value === "code" ? copy.emailMethod : copy.passwordMethod}
              </button>
            ))}
          </div>}
          <form method="post" onSubmit={submit} aria-labelledby="auth-title" aria-busy={busy}>
            <fieldset className={styles.fields} disabled={busy}>
              {mode === "signup" && <>
                <div className={styles.nameRow}>
                  <div className={styles.field}>
                    <label htmlFor="auth-firstName">{copy.firstName}</label>
                    <input className={styles.input} id="auth-firstName" name="firstName" autoComplete="given-name" required maxLength={100} value={form.firstName} onChange={event => change("firstName", event.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="auth-lastName">{copy.lastName}</label>
                    <input className={styles.input} id="auth-lastName" name="lastName" autoComplete="family-name" required maxLength={100} value={form.lastName} onChange={event => change("lastName", event.target.value)} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label htmlFor="auth-phone">{copy.phone} <span className={styles.optional}>({copy.optional})</span></label>
                  <input className={styles.input} id="auth-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} value={form.phone} onChange={event => change("phone", event.target.value)} />
                </div>
              </>}
              <div className={styles.field}>
                <label htmlFor="auth-email">{copy.email}</label>
                <input ref={emailInput} className={styles.input} id="auth-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} required value={form.email} onChange={event => change("email", event.target.value)} />
              </div>
              {(mode === "signup" || method === "password") && <PasswordField id="auth-password" label={copy.password} value={form.password} onChange={value => change("password", value)} newPassword={mode === "signup"} hint={mode === "signup" ? copy.passwordHelp : undefined} />}
              {mode === "signup" && <PasswordField id="auth-confirmPassword" label={copy.confirmPassword} value={form.confirmPassword} onChange={value => change("confirmPassword", value)} newPassword />}
            </fieldset>
            {mode === "login" && method === "code" && <p className={styles.hint}>{copy.emailHelp}</p>}
            <button className={`${styles.primary} ${styles.submitSpace}`} type="submit" disabled={busy || waitingToSend}>
              {busy ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
              {busy ? copy.working : waitingToSend ? `${copy.resendIn} ${countdown}` : mode === "signup" ? (emailOtpEnabled ? copy.createAndVerify : copy.createAccount) : (method === "code" ? copy.sendCode : copy.signIn)}
            </button>
          </form>
        </>
      )}
      {!legacyConfirmation && <p className={styles.switch}>
        {mode === "signup" ? copy.alreadyRegistered : copy.newHere}
        <Link href={`${mode === "signup" ? "/login" : "/signup"}${redirectQuery}`}>{mode === "signup" ? copy.loginLink : copy.signupLink}</Link>
      </p>}
      {redirectTo.startsWith("/booking") && <p className={styles.continuation}><CalendarDays size={16} aria-hidden="true" />{copy.continueBooking}</p>}
    </AuthShell>
  );
}
