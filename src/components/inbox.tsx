"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { C, GhostButton, PrimaryButton } from "@/components/ui";
import { whenText } from "@/lib/format";
import { mergeNotices, readLocalNotices, upsertLocalNotices } from "@/lib/notice-cache";
import type { DeskNotice } from "@/lib/types";

export function Inbox({ rmId }: { rmId: string }) {
  const [notices, setNotices] = useState<DeskNotice[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const local = readLocalNotices().filter((n) => n.rm_id === rmId);
    setNotices(local);
    try {
      const res = await fetch("/api/notifications");
      const data = (await res.json()) as { notices?: DeskNotice[] };
      if (data.notices) {
        upsertLocalNotices(data.notices);
        setNotices(mergeNotices(local, data.notices).filter((n) => n.rm_id === rmId));
      }
    } catch {
      /* local copy is enough in preview */
    }
  }, [rmId]);

  useEffect(() => {
    void refresh();
    const t = window.setInterval(() => void refresh(), 12000);
    return () => window.clearInterval(t);
  }, [refresh]);

  async function patch(id: string, action: "read" | "ack") {
    setBusy(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { notice?: DeskNotice };
      if (data.notice) {
        upsertLocalNotices([data.notice]);
        setNotices((rows) => mergeNotices(rows, [data.notice!]).filter((n) => n.rm_id === rmId));
      } else {
        const stamp = new Date().toISOString();
        setNotices((rows) => {
          const next = rows.map((n) =>
            n.id === id ? { ...n, read_at: n.read_at || stamp, ack_at: action === "ack" ? stamp : n.ack_at } : n,
          );
          upsertLocalNotices(next);
          return next;
        });
      }
    } finally {
      setBusy(null);
    }
  }

  const unread = notices.filter((n) => !n.read_at).length;

  return (
    <div className="desk-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2">
          <Bell size={15} style={{ color: unread ? C.gold : C.slate }} />
          <div className="text-sm font-semibold" style={{ color: C.ink }}>
            Inbox
          </div>
          {unread > 0 ? (
            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: C.gold, color: C.navyDeep }}>
              {unread} new
            </span>
          ) : null}
        </div>
        <span className="text-[11px]" style={{ color: C.slateLight }}>
          From your team lead
        </span>
      </div>
          {notices.length === 0 ? (
            <p className="px-4 py-6 text-xs" style={{ color: C.slate }}>
              No notices yet. When your team lead filters the book and sends a check-in, it lands here.
            </p>
          ) : (
            <ul>
              {notices.slice(0, 8).map((n) => (
                <li
                  key={n.id}
                  className="px-4 py-3"
                  style={{
                    borderBottom: `1px solid ${C.lineSoft}`,
                    background: n.read_at ? C.panel : n.priority === "high" ? C.redBg : C.amberBg,
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: C.ink }}>
                        {n.title}
                      </div>
                      <div className="mt-0.5 text-[11px]" style={{ color: C.slate }}>
                        {n.from_name}
                        {n.created_at ? ` · ${whenText(n.created_at)}` : ""}
                        {n.priority === "high" ? " · urgent" : ""}
                      </div>
                    </div>
                    {n.ack_at ? (
                      <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: C.green }}>
                        <Check size={12} /> acknowledged
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6" style={{ color: C.ink }}>
                    {n.body}
                  </p>
                  {n.reason ? (
                    <p className="mt-1 text-[11px]" style={{ color: C.slate }}>
                      Why you were included: {n.reason}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!n.read_at ? (
                      <GhostButton onClick={() => void patch(n.id, "read")}>{busy === n.id ? "…" : "Mark read"}</GhostButton>
                    ) : null}
                    {!n.ack_at ? (
                      <PrimaryButton onClick={() => void patch(n.id, "ack")} tone="green" disabled={busy === n.id}>
                        Acknowledge
                      </PrimaryButton>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
    </div>
  );
}
