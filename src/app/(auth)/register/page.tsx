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
import {
  getLecturerEntryPath,
  registerClassRep,
  registerLecturer,
  useStaffSession,
} from "@/lib/staff-auth";
import type { ClassStreamId } from "@/types";

export default function StaffRegisterPage() {
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

  const isCr = role === "class_rep";
  const isLecturer = role === "lecturer";

  useEffect(() => {
    if (!isCr && !isLecturer) {
      router.replace("/login");
      return;
    }
    if (ready && session?.role === role) {
      router.replace(
        role === "lecturer" ? getLecturerEntryPath(session) : APP_HOME[role],
      );
    }
  }, [isCr, isLecturer, ready, role, router, session]);

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
      const result = isLecturer
        ? await registerLecturer({
            name: name.trim(),
            email: normalized,
            password,
          })
        : await registerClassRep({
            name: name.trim(),
            email: normalized,
            password,
            streamId,
          });
      if (result.needsVerification || !result.session) {
        sessionStorage.setItem("darasax_verify_email", normalized);
        router.push("/verify-email");
        return;
      }
      router.replace(
        isLecturer
          ? getLecturerEntryPath(result.session)
          : APP_HOME[role],
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!isCr && !isLecturer) {
    return null;
  }

  return (
    <AuthShell
      title={
        isLecturer ? (
          <>
            Join as
            <br />
            Lecturer.
          </>
        ) : (
          <>
            Join as Class
            <br />
            Representative.
          </>
        )
      }
      subtitle={
        isLecturer
          ? "Register to publish notes, assignments, and module topics to students."
          : "Register once for your stream, then manage uploads and the class timetable."
      }
    >
      <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-lg">
        {isLecturer ? "Create lecturer account" : "Create CR account"}
      </h1>

      <form
        className="mt-5 space-y-3.5 sm:mt-4 sm:space-y-3"
        onSubmit={onSubmit}
        noValidate
      >
        {error ? <AuthAlert message={error} /> : null}

        <label className="block text-sm font-medium sm:text-xs">
          Full name
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="focus-ring mt-1.5 h-11 w-full rounded-[10px] border border-border bg-card px-3 text-[15px] sm:mt-1 sm:h-10 sm:text-sm"
          />
        </label>

        <label className="block text-sm font-medium sm:text-xs">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring mt-1.5 h-11 w-full rounded-[10px] border border-border bg-card px-3 text-[15px] sm:mt-1 sm:h-10 sm:text-sm"
          />
        </label>

        {isCr ? (
          <label className="block text-sm font-medium sm:text-xs">
            Stream
            <select
              value={streamId}
              onChange={(e) => setStreamId(e.target.value as ClassStreamId)}
              className="focus-ring mt-1.5 h-11 w-full rounded-[10px] border border-border bg-card px-3 text-[15px] sm:mt-1 sm:h-10 sm:text-sm"
            >
              {classStreams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                  {s.isEvening ? " (Evening)" : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <PasswordField
          id="staff-register-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <PasswordField
          id="staff-register-confirm"
          label="Confirm password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />

        <AuthSubmitButton loading={loading} loadingText="Creating...">
          Create account
        </AuthSubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground sm:mt-4 sm:text-xs">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-primary">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
