"use client";

type TurnstileApi = {
  render(element: HTMLElement, options: Record<string, unknown>): string;
  execute(id: string): void;
  remove(id: string): void;
};
let loading: Promise<TurnstileApi> | undefined;
let queue: Promise<unknown> = Promise.resolve();
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function load(): Promise<TurnstileApi> {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.nonce = document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce ?? "";
    const timeout = setTimeout(() => { script.remove(); loading = undefined; reject(new Error("Security check could not load. Please try again.")); }, 20000);
    script.onload = () => {
      clearTimeout(timeout);
      const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (api) resolve(api); else { loading = undefined; reject(new Error("Security check unavailable. Please try again.")); }
    };
    script.onerror = () => { clearTimeout(timeout); script.remove(); loading = undefined; reject(new Error("Security check could not load. Please check your connection and try again.")); };
    document.head.appendChild(script);
  });
  return loading;
}

async function challenge(): Promise<string> {
  const api = await load();
  return new Promise((resolve, reject) => {
    const panel = document.createElement("div");
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Security verification"); panel.setAttribute("aria-modal", "true");
    Object.assign(panel.style, { position: "fixed", inset: "0", zIndex: "9999", display: "none", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.65)" });
    const box = document.createElement("div");
    Object.assign(box.style, { background: "white", color: "black", borderRadius: "12px", padding: "16px", maxWidth: "calc(100vw - 24px)" });
    const label = document.createElement("p"); label.textContent = "Please complete the security check.";
    const widget = document.createElement("div");
    const close = document.createElement("button"); close.type = "button"; close.textContent = "Cancel";
    box.append(label, widget, close); panel.append(box); document.body.append(panel);
    let id: string | undefined;
    let done = false;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const finish = (token?: string) => {
      if (done) return; done = true; clearTimeout(timer);
      if (id) api.remove(id); panel.remove(); previousFocus?.focus();
      if (token) resolve(token); else reject(new Error("Security check was not completed. Please try again."));
    };
    const timer = setTimeout(() => finish(), 120000);
    close.onclick = () => finish();
    panel.onkeydown = event => { if (event.key === "Escape") finish(); };
    try {
      id = api.render(widget, { sitekey: SITE_KEY, execution: "execute", appearance: "interaction-only", theme: "light",
        callback: (token: string) => finish(token), "error-callback": () => { finish(); return true; },
        "expired-callback": () => finish(), "timeout-callback": () => finish(),
        "before-interactive-callback": () => { panel.style.display = "flex"; close.focus(); },
      });
      api.execute(id);
    } catch { finish(); }
  });
}

/** Fresh single-use token for each protected operation; never stored or reused. */
export function getCaptchaToken(): Promise<string | undefined> {
  if (!SITE_KEY || typeof window === "undefined") return Promise.resolve(undefined);
  const result = queue.then(challenge);
  queue = result.catch(() => undefined);
  return result;
}

export async function captchaFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  const authOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
  const protectedPath = ["/auth/v1/signup", "/auth/v1/recover", "/auth/v1/otp", "/auth/v1/resend"].includes(url.pathname)
    || (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "password");
  if (SITE_KEY && url.origin === authOrigin && protectedPath && init?.method?.toUpperCase() === "POST") {
    const token = await getCaptchaToken();
    const body = JSON.parse(String(init.body ?? "{}"));
    body.gotrue_meta_security = { ...body.gotrue_meta_security, captcha_token: token };
    return fetch(input, { ...init, body: JSON.stringify(body) });
  }
  return fetch(input, init);
}
