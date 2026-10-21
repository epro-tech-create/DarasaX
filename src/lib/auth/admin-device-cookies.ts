export function adminCookieNames(secure: boolean) {
  const prefix = secure ? "__Host-" : "";
  return {
    challenge: `${prefix}darasax-admin-challenge`,
    browser: `${prefix}darasax-admin-browser`,
  };
}

export function adminCookieOptions(secure: boolean, maxAge: number) {
  return { httpOnly: true, secure, sameSite: "strict" as const, path: "/", maxAge };
}
