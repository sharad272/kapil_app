export async function timedFetch(input: RequestInfo | URL, init: RequestInit = {}, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, {
      ...init,
      signal: ctrl.signal,
      credentials: "same-origin",
      cache: init.cache ?? "no-store",
    });
  } finally {
    clearTimeout(t);
  }
}

export async function enterDesk(body: { id?: string; role?: string }) {
  const res = await timedFetch("/api/demo/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error("Could not open that desk");
  }
}

/** Full load — iOS Safari often stalls on client navigations after a cookie is set. */
export function hardOpen(href: string) {
  window.location.replace(href);
}

export async function leaveDesk() {
  try {
    await timedFetch("/api/demo/session", { method: "DELETE" }, 4000);
  } catch {
    /* still leave */
  }
  window.location.replace("/login");
}

export function requestBack() {
  const ev = new CustomEvent("desk:back", { cancelable: true });
  window.dispatchEvent(ev);
  if (ev.defaultPrevented) return;

  const tab = (window.history.state as { deskTab?: string } | null)?.deskTab;
  if (tab && tab !== "dashboard") {
    window.history.back();
    return;
  }

  const path = window.location.pathname;
  if (path === "/tl" || path === "/rm") return;

  if (window.history.length > 1) window.history.back();
}
