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

export type NoticePriority = "normal" | "high";

export interface DeskNotice {
  id: string;
  rm_id: string;
  rm_name: string;
  from_id: string;
  from_name: string;
  title: string;
  body: string;
  query: string;
  reason: string;
  priority: NoticePriority;
  month_id: string;
  created_at: string;
  read_at: string | null;
  ack_at: string | null;
}

export interface RmKpi {
  id: string;
  name: string;
  email: string;
  month: string;
  ape: number;
  frp: number;
  policies: number;
  target: number;
  achievementPct: number | null;
  quality: number | null;
  momPct: number | null;
  submitted: boolean;
  ulip: number | null;
  endowment: number | null;
  term: number | null;
  certAvg: number | null;
  flags: string[];
}

export interface AssistantMatch {
  id: string;
  name: string;
  email: string;
  reason: string;
  message: string;
  kpis: RmKpi;
}

export interface AssistantResult {
  interpretation: string;
  brief: string;
  source: "huggingface" | "groq" | "rules";
  matches: AssistantMatch[];
}
