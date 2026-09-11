export async function enterDesk(body: { id?: string; role?: string }) {
  const res = await fetch("/api/demo/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });
  if (!res.ok) {
    throw new Error("Could not open that desk");
  }
}
