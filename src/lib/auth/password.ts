export type PasswordStrength = "weak" | "fair" | "good" | "strong";
export const MIN_PASSWORD_LENGTH = 12;
export const PASSWORD_REQUIREMENT = "Use at least 12 characters. Avoid common passwords and repeated characters.";
const COMMON_PASSWORDS = new Set(["password1234", "password123!", "password12345", "password123456", "123456789012", "qwerty123456", "qwertyuiop12", "abcdefghijkl", "letmein123456"]);

export function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
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
  return checks.minLength && !COMMON_PASSWORDS.has(password.toLowerCase()) && !/^(.)\1+$/u.test(password);
}
