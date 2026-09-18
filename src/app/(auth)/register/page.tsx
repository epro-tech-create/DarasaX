"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { PasswordField } from "@/components/auth/password-field";
import { classStreams } from "@/data/mock";
import { APP_HOME, getAppRole } from "@/lib/app-role";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { registerClassRep, useStaffSession } from "@/lib/staff-auth";
import type { ClassStreamId } from "@/types";

export default function ClassRepRegisterPage() {
  const router = useRouter();
  const role = getAppRole();
  const { session, ready } = useStaffSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [streamId, setStreamId] = useState<ClassStreamId>(
    classStreams[0]?.id ?? "BENG24COE-1",
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role !== "class_rep") {
      router.replace("/login");
      return;
    }
    if (ready && session?.role === "class_rep") {
      router.replace(APP_HOME.class_rep);
    }
  }, [ready, role, router, session]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const normalized = normalizeEmail(email);
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!isValidEmail(normalized)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await registerClassRep({
        name: name.trim(),
        email: normalized,
        password,
        streamId,
      });
      router.replace(APP_HOME.class_rep);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  if (role !== "class_rep") {
    return null;
  }

  return (
    <AuthShell
      title={
        <>
          Join as Class
          <br />
          Representative.
        </>
      }
      subtitle="Register once for your stream, then manage uploads and the class timetable."
    >
      <h1 className="font-heading text-lg font-semibold tracking-tight">
        Create CR account
      </h1>
      <p className="mt-0.5 text-xs text-muted-foreground">
        For appointed class representatives only.
      </p>

      <form className="mt-4 space-y-3" onSubmit={onSubmit} noValidate>
        {error ? <AuthAlert message={error} /> : null}

        <label className="block text-xs font-medium">
          Full name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="focus-ring mt-1 h-10 w-full rounded-[10px] border border-border bg-card px-3 text-sm"
          />
        </label>

        <label className="block text-xs font-medium">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring mt-1 h-10 w-full rounded-[10px] border border-border bg-card px-3 text-sm"
          />
        </label>

        <label className="block text-xs font-medium">
          Stream
          <select
            value={streamId}
            onChange={(e) => setStreamId(e.target.value as ClassStreamId)}
            className="focus-ring mt-1 h-10 w-full rounded-[10px] border border-border bg-card px-3 text-sm"
          >
            {classStreams.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
                {s.isEvening ? " (Evening)" : ""}
              </option>
            ))}
          </select>
        </label>

        <PasswordField
          id="cr-register-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <PasswordField
          id="cr-register-confirm"
          label="Confirm password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />

        <AuthSubmitButton loading={loading} loadingText="Creating account...">
          Create account
        </AuthSubmitButton>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-primary">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
