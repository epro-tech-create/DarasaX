import { roleFromHost } from "@/lib/app-role";

function firstHeaderValue(value: string | null) {
  return value?.split(",", 1)[0]?.trim() || null;
}

/**
 * Resolve the browser-visible origin behind the trusted VPS reverse proxy.
 * The app ports bind to loopback, and Nginx overwrites these forwarded headers.
 */
export function publicRequestOrigin(request: Request): string | null {
  const requestUrl = new URL(request.url);
  const host = firstHeaderValue(request.headers.get("x-forwarded-host")) ??
    firstHeaderValue(request.headers.get("host")) ?? requestUrl.host;
  const protocol = firstHeaderValue(request.headers.get("x-forwarded-proto"))?.toLowerCase() ??
    requestUrl.protocol.slice(0, -1).toLowerCase();

  if (protocol !== "http" && protocol !== "https") return null;

  let parsed: URL;
  try {
    parsed = new URL(`${protocol}://${host}`);
  } catch {
    return null;
  }
  if (parsed.username || parsed.password || parsed.pathname !== "/") return null;

  const localHost = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  if (!localHost && (!roleFromHost(parsed.host) || protocol !== "https")) return null;

  return parsed.origin;
}

export function hasValidRequestOrigin(request: Request, requireOrigin = true) {
  const origin = request.headers.get("origin");
  if (!origin) return !requireOrigin;
  return origin === publicRequestOrigin(request);
}

export function isSecureRequest(request: Request) {
  const forwardedProtocol = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  return (forwardedProtocol ?? new URL(request.url).protocol.slice(0, -1)).toLowerCase() === "https";
}
