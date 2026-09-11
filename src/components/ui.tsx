"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { C } from "@/lib/theme";

export { C };

export function Delta({ value, points = false }: { value: number | null; points?: boolean }) {
  if (value === null) {
    return (
      <span className="text-xs" style={{ color: C.slateLight }}>
        no prior month
      </span>
    );
  }
  const up = value >= 0;
  return (
    <span className="text-xs font-semibold" style={{ color: up ? C.green : C.red }}>
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}
      {points ? " pts" : "%"}
    </span>
  );
}

export function StatTile({
  label,
  value,
  delta,
  sub,
  points,
  valueColor,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number | null;
  sub?: string;
  points?: boolean;
  valueColor?: string;
}) {
  return (
    <div className="min-w-[160px] flex-1 rounded-lg px-4 py-3" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
      <div className="mb-1 text-xs" style={{ color: C.slate }}>
        {label}
      </div>
      <div className="text-2xl font-semibold leading-tight tabular-nums" style={{ color: valueColor || C.navy }}>
        {value}
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-2">
        {delta !== undefined ? <Delta value={delta ?? null} points={points} /> : null}
        {sub ? (
          <span className="truncate text-xs" style={{ color: C.slateLight }}>
            {sub}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function NumInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: number | string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      value={value === null || value === undefined ? "" : String(value)}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded px-2 py-1 text-right text-sm tabular-nums outline-none disabled:opacity-60"
      style={{
        border: `1px solid ${C.line}`,
        color: C.ink,
        background: disabled ? C.lineSoft : C.panel,
      }}
    />
  );
}

export function PrimaryButton({
  children,
  onClick,
  icon: Icon,
  tone = "navy",
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: LucideIcon;
  tone?: "navy" | "gold" | "green";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const bg = tone === "gold" ? C.gold : tone === "green" ? C.green : C.navy;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium disabled:opacity-40"
      style={{ background: bg, color: tone === "gold" ? C.navyDeep : "#fff" }}
    >
      {Icon ? <Icon size={15} /> : null}
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  icon: Icon,
  danger,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: LucideIcon;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
      style={{
        border: `1px solid ${danger ? "#F0C4B8" : C.line}`,
        color: danger ? C.red : C.ink,
        background: C.panel,
      }}
    >
      {Icon ? <Icon size={15} /> : null}
      {children}
    </button>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg px-6 py-14 text-center" style={{ background: C.panel, border: `1px dashed ${C.line}` }}>
      <Icon size={28} style={{ color: C.slateLight }} className="mx-auto mb-3" />
      <div className="mb-1 text-base font-semibold" style={{ color: C.ink }}>
        {title}
      </div>
      <div className="mx-auto mb-5 max-w-md text-sm" style={{ color: C.slate }}>
        {body}
      </div>
      {action}
    </div>
  );
}

export function TopBar({
  title,
  subtitle,
  right,
  status,
  onSignOut,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  status?: string;
  onSignOut: () => void;
}) {
  return (
    <div className="px-5 py-4" style={{ background: C.navy }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-white">{title}</div>
          <div className="mt-0.5 text-xs" style={{ color: C.ice }}>
            {subtitle}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {status ? (
            <span className="text-xs" style={{ color: C.ice }}>
              {status}
            </span>
          ) : null}
          {right}
          <button
            onClick={onSignOut}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-white"
            style={{ background: C.navyDeep, border: `1px solid ${C.navyMid}` }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
