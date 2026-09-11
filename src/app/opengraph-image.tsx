import { ImageResponse } from "next/og";

export const alt = "Team Victory — Cross Sell";
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
        <div style={{ fontSize: 20, letterSpacing: 6, color: "#C9A24B" }}>KAPIL SHARMA · PRODUCTION DESK</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 84, lineHeight: 0.9, fontWeight: 600 }}>Team Victory</div>
          <div style={{ fontSize: 64, lineHeight: 0.9, color: "#C9A24B", fontWeight: 500 }}>Cross Sell</div>
        </div>
      </div>
    ),
    size,
  );
}
