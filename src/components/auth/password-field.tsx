"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  getPasswordChecks,
  getPasswordStrength,
} from "@/lib/auth/password";

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  showStrength,
  error,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  showStrength?: boolean;
  error?: string;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const strength = getPasswordStrength(value);
  const checks = getPasswordChecks(value);

  const strengthColor = {
    weak: "bg-danger",
    fair: "bg-warning",
    good: "bg-primary",
    strong: "bg-success",
  }[strength.label];

  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-medium sm:text-[11px]">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "focus-ring h-11 w-full rounded-[10px] border bg-card px-3 pr-10 text-[15px] sm:h-9 sm:rounded-[9px] sm:px-2.5 sm:pr-9 sm:text-[13px]",
            error ? "border-danger" : "border-border",
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="focus-ring absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground sm:right-1 sm:h-6 sm:w-6"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> : <Eye className="h-4 w-4 sm:h-3.5 sm:w-3.5" />}
        </button>
      </div>

      {showStrength && value ? (
        <div className="mt-1.5 space-y-1">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={cn(
                  "h-0.5 flex-1 rounded-full bg-muted",
                  n <= strength.score && strengthColor,
                )}
              />
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-0.5 text-[11px] text-muted-foreground sm:text-[9px]">
            <li className={checks.minLength ? "text-success" : undefined}>
              8+ characters
            </li>
            <li className={checks.hasUpper ? "text-success" : undefined}>
              Uppercase
            </li>
            <li className={checks.hasLower ? "text-success" : undefined}>
              Lowercase
            </li>
            <li className={checks.hasNumber ? "text-success" : undefined}>
              Number
            </li>
          </ul>
        </div>
      ) : null}

      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger sm:text-[11px]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
