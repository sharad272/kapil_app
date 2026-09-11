import { ImageResponse } from "next/og";

export const alt = "RM Productivity Portal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1E2761",
          color: "#F7F8FC",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 4, color: "#C9A24B" }}>RM PRODUCTIVITY PORTAL</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64, lineHeight: 1.05, maxWidth: 900 }}>
            APE, FRP and quality — without RMs seeing each other.
          </div>
          <div style={{ fontSize: 22, color: "#CADCFC" }}>Row-level security · team lead console · Vercel</div>
        </div>
      </div>
    ),
    size,
  );
}
