"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft } from "lucide-react";
import { C } from "@/lib/theme";
import { initials } from "@/lib/format";

export { C };

export function Avatar({
  name,
  gold = false,
  size = 36,
}: {
  name: string;
  gold?: boolean;
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-wide"
      style={{
        width: size,
        height: size,
        background: gold ? C.gold : C.navy,
        color: gold ? C.navyDeep : "#fff",
        fontSize: size < 32 ? 10 : 12,
      }}
    >
      {initials(name)}
    </span>
  );
}

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
    <div
      className="desk-card desk-card-hover min-w-0 flex-[1_1_calc(50%-0.375rem)] px-3 py-3.5 sm:min-w-[160px] sm:flex-1 sm:px-4"
    >
      <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: C.slate }}>
        {label}
      </div>
      <div className="text-xl font-semibold leading-tight tabular-nums sm:text-2xl" style={{ color: valueColor || C.navy }}>
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
      className="desk-input w-full rounded-lg px-2 py-2 text-right text-base tabular-nums outline-none disabled:opacity-60 sm:py-1.5 sm:text-sm"
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
  block = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: LucideIcon;
  tone?: "navy" | "gold" | "green";
  disabled?: boolean;
  type?: "button" | "submit";
  block?: boolean;
}) {
  const bg = tone === "gold" ? C.gold : tone === "green" ? C.green : C.navy;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`desk-btn inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium disabled:opacity-40 ${block ? "w-full" : ""}`}
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
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: LucideIcon;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="desk-btn inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40"
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
    <div className="desk-card px-6 py-14 text-center">
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
  onBack,
  sticky = true,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  status?: string;
  onSignOut: () => void;
  onBack?: () => void;
  sticky?: boolean;
}) {
  return (
    <div
      className={`${sticky ? "sticky top-0 z-30" : ""} px-4 py-3 sm:px-5 sm:py-4`}
      style={{
        background: `linear-gradient(180deg, ${C.navyDeep} 0%, ${C.navy} 100%)`,
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        borderBottom: `2px solid ${C.gold}`,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {onBack ? (
            <button
              type="button"
              aria-label="Go back"
              onClick={onBack}
              className="desk-btn mt-0.5 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-white sm:hidden"
              style={{ background: C.navyDeep, border: `1px solid ${C.navyMid}` }}
            >
              <ChevronLeft size={20} />
            </button>
          ) : null}
          <div className="min-w-0">
            <div className="serif text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</div>
            <div className="mt-0.5 text-xs" style={{ color: C.ice }}>
              {subtitle}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {status ? (
            <span className="text-xs" style={{ color: C.ice }}>
              {status}
            </span>
          ) : null}
          {right}
          <button
            onClick={onSignOut}
            className="desk-btn min-h-11 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
            style={{ background: C.navyDeep, border: `1px solid ${C.navyMid}` }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export function TableScroll({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <p className="px-4 pb-1 text-[11px] sm:hidden" style={{ color: C.slateLight }}>
        Swipe sideways for the rest of the columns
      </p>
      <div data-no-swipe className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">{children}</div>
    </div>
  );
}
