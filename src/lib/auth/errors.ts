export function getAuthErrorMessage(error: unknown): string {
  const message =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "";

  const lower = message.toLowerCase();
  if (lower.includes("registration number is already registered")) return "This registration number is already registered. Sign in to your existing account or contact your administrator.";
  if (lower.includes("registration number must contain numbers only")) return "Registration number must contain numbers only.";
  if (lower.includes("contact your class representative or administrator")) return "Contact your Class Representative or Administrator about your access.";

  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials") ||
    lower.includes("invalid email or password")
  ) {
    return "Invalid email or password.";
  }

  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return "Please verify your email before signing in.";
  }

  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Try signing in.";
  }

  if (
    lower.includes("provider is not enabled") ||
    lower.includes("unsupported provider")
  ) {
    return "This sign-in provider is not enabled yet. Please contact the administrator.";
  }

  if (
    lower.includes("redirect_uri") ||
    (lower.includes("redirect") && lower.includes("mismatch"))
  ) {
    return "The sign-in callback URL is misconfigured. Please contact the administrator.";
  }

  if (lower.includes("did not return a redirect url")) return "Sign-in could not start. Please try again.";

  if (lower.includes("unable to exchange external code")) {
    return "Sign-in failed during callback. Please try again.";
  }

  if (lower.includes("error sending confirmation email") || lower.includes("error sending")) {
    return "We couldn't send the verification email. Check SMTP settings and try again.";
  }

  if (lower.includes("token") && (lower.includes("expired") || lower.includes("otp_expired"))) {
    return "Verification code has expired.";
  }

  if (
    lower.includes("otp") ||
    lower.includes("token has expired") ||
    lower.includes("invalid token") ||
    (lower.includes("invalid") && lower.includes("code"))
  ) {
    return "Verification code is incorrect.";
  }

  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (lower.includes("password") && lower.includes("weak")) {
    return "Please choose a stronger password.";
  }

  if (lower.includes("same password")) {
    return "New password must be different from your current password.";
  }

  if (lower.includes("signup requires a valid password")) {
    return "Please choose a stronger password.";
  }

  if (lower.includes("network") || lower.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }

  return "Something went wrong. Please try again.";
}
