import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Sportsbyttet — Brukt utstyr. Ekte kvalitet. Din klubb.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a3c2e",
          position: "relative",
        }}
      >
        {/* Subtle mountain shapes */}
        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.08 }}
        >
          <path d="M0,630 L0,400 Q200,250 400,350 Q600,480 800,300 Q1000,150 1200,250 L1200,630 Z" fill="white" />
          <path d="M0,630 L0,480 Q300,350 600,450 Q900,530 1100,380 Q1200,320 1200,380 L1200,630 Z" fill="white" />
        </svg>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            zIndex: 1,
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 700, color: "white", letterSpacing: -2 }}>
            Sportsbyttet
          </div>
          <div
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.7)",
              letterSpacing: 0.5,
            }}
          >
            Brukt utstyr. Ekte kvalitet. Din klubb.
          </div>
          <div
            style={{
              width: 60,
              height: 4,
              backgroundColor: "#d97706",
              borderRadius: 2,
              marginTop: 12,
            }}
          />
          <div
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.5)",
              marginTop: 8,
            }}
          >
            sportsbyttet.no
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
