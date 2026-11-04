export const policyPaths = ["/legal/privacy", "/legal/terms", "/legal/security"] as const;

export function isPolicyPath(pathname: string) {
  return policyPaths.some(path => pathname === path);
}
