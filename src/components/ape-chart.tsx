"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { C } from "@/lib/theme";

export default function ApeChart({
  data,
}: {
  data: { month: string; APE: number; Target: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.lineSoft} vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.slate }} axisLine={{ stroke: C.line }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 6, border: `1px solid ${C.line}`, fontSize: 13 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Target" fill={C.lineSoft} radius={[3, 3, 0, 0]} />
        <Bar dataKey="APE" fill={C.navy} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
