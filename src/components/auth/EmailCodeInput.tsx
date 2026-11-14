"use client";

import { useEffect, useRef } from "react";
import { normalizeEmailCode } from "@/lib/customer-auth";
import styles from "./CustomerAuth.module.css";

type CodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled: boolean;
  invalid: boolean;
  describedBy: string;
};

export function EmailCodeInput({ value, onChange, label, disabled, invalid, describedBy }: CodeInputProps) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!disabled) input.current?.focus();
  }, [disabled, invalid]);
  return (
    <div className={styles.field}>
      <label htmlFor="auth-code">{label}</label>
      <div className={styles.codeGroup} data-invalid={invalid || undefined}>
        <input
          ref={input}
          id="auth-code"
          name="code"
          className={styles.codeInput}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          disabled={disabled}
          value={value}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={event => onChange(normalizeEmailCode(event.target.value))}
          onPaste={event => {
            event.preventDefault();
            onChange(normalizeEmailCode(event.clipboardData.getData("text")));
          }}
        />
        <div className={styles.codeSlots} aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => <span key={index} data-filled={!!value[index]}>{value[index] || ""}</span>)}
        </div>
      </div>
    </div>
  );
}
