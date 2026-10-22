/** Browser security policy shared by Next headers and the request proxy. */
export function contentSecurityPolicy(nonce?: string, development = false): string {
  const scripts = nonce ? `'self' 'nonce-${nonce}' 'strict-dynamic'` : "'self'";
  return [
    "default-src 'self'",
    `script-src ${scripts}${development ? " 'unsafe-eval'" : ""}`,
    // React/Framer Motion use inline style attributes; scripts remain nonce-only.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.r2.cloudflarestorage.com" + (development ? " ws://localhost:* http://localhost:*" : ""),
    "frame-src 'self' blob: https://challenges.cloudflare.com https://*.supabase.co https://*.r2.cloudflarestorage.com https://docs.google.com https://view.officeapps.live.com",
    "worker-src 'self' blob:",
    "media-src 'self' blob: https://*.supabase.co https://*.r2.cloudflarestorage.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(development ? [] : ["upgrade-insecure-requests"]),
  ].join('; ');
}

export const browserSecurityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];
