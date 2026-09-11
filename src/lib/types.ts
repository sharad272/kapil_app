export type Role = "rm" | "tl";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  active: boolean;
}

export interface MonthRow {
  id: string;
  label: string;
  sort_order: number;
  is_open: boolean;
}

export interface Assignment {
  rm_id: string;
  month_id: string;
  target: number | null;
  quality_score: number | null;
}

export interface Submission {
  rm_id: string;
  month_id: string;
  ape: number | null;
  frp: number | null;
  policies: number | null;
  submitted_at: string | null;
}

export interface Certification {
  rm_id: string;
  ulip: number | null;
  endowment: number | null;
  term: number | null;
}

export interface CoachingNote {
  rm_id: string;
  note: string;
}

export type AppMode = "demo" | "live";

export interface Session {
  profile: Profile;
  mode: AppMode;
}

export interface RMPayload {
  profile: Profile;
  months: MonthRow[];
  submissions: Submission[];
  assignments: Assignment[];
  certs: Certification | null;
  mode: AppMode;
}

export interface TLPayload {
  profile: Profile;
  team: Profile[];
  months: MonthRow[];
  submissions: Submission[];
  assignments: Assignment[];
  certs: Certification[];
  notes: CoachingNote[];
  mode: AppMode;
}
