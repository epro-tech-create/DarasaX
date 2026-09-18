export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}

export function getPasswordStrength(password: string): {
  score: number;
  label: PasswordStrength;
} {
  const checks = getPasswordChecks(password);
  const score = Object.values(checks).filter(Boolean).length;

  if (score <= 2) return { score, label: "weak" };
  if (score === 3) return { score, label: "fair" };
  if (score === 4) return { score, label: "good" };
  return { score, label: "strong" };
}

export function isPasswordStrongEnough(password: string): boolean {
  const checks = getPasswordChecks(password);
  return checks.minLength;
}
