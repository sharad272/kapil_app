import { DEMO_RMS } from "@/lib/demo-data";
import type { Profile } from "@/lib/types";

type Store = { team: Profile[] };

const g = globalThis as typeof globalThis & { __deskTeam?: Store };

function store(): Store {
  if (!g.__deskTeam) {
    g.__deskTeam = { team: DEMO_RMS.map((rm) => ({ ...rm })) };
  }
  return g.__deskTeam;
}

export function listTeam() {
  return store().team.filter((rm) => rm.active);
}

export function findRm(id: string) {
  return listTeam().find((rm) => rm.id === id) ?? null;
}

export function addRm(input: { full_name: string; email: string }) {
  const email = input.email.trim().toLowerCase();
  const name = input.full_name.trim();
  const existing = store().team.find((rm) => rm.email.toLowerCase() === email);
  if (existing) {
    existing.active = true;
    existing.full_name = name || existing.full_name;
    return existing;
  }
  const rm: Profile = {
    id: crypto.randomUUID(),
    email,
    full_name: name,
    role: "rm",
    active: true,
  };
  store().team.push(rm);
  return rm;
}

export function removeRm(id: string) {
  const row = store().team.find((rm) => rm.id === id);
  if (!row) return null;
  row.active = false;
  return row;
}
