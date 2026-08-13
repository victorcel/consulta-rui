import { ImageResponse } from "next/og";

export const alt = "Consulta RUI - Registro Único de Ingreso";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
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
          backgroundColor: "#060912",
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(6,182,212,0.25), rgba(6,182,212,0) 60%), radial-gradient(circle at 100% 100%, rgba(8,145,178,0.18), rgba(8,145,178,0) 55%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 24,
            backgroundColor: "rgba(6,182,212,0.12)",
            border: "2px solid rgba(6,182,212,0.35)",
            marginBottom: 36,
          }}
        >
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2 L20 5.5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5.5 Z"
              stroke="#22d3ee"
              strokeWidth="1.6"
              fill="rgba(34,211,238,0.12)"
            />
            <path
              d="M9 12 L11.2 14.3 L15.5 9.7"
              stroke="#22d3ee"
              strokeWidth="1.8"
              fill="none"
            />
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 700,
            color: "#e2e8f0",
            letterSpacing: "-0.02em",
          }}
        >
          Consulta RUI
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            marginTop: 18,
            color: "#94a3b8",
          }}
        >
          Registro Único de Ingreso · Colombia
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 44,
            padding: "10px 22px",
            borderRadius: 999,
            backgroundColor: "rgba(6,182,212,0.1)",
            border: "1px solid rgba(6,182,212,0.3)",
            color: "#22d3ee",
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          www.col0.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
