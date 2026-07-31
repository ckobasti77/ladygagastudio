import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

export const alt = "Studio Lady Gaga - frizerski salon Sabac i premium nega kose";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f7f0ea",
          color: "#241f1b",
          fontFamily: "Arial",
          padding: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            border: "2px solid #9b7c68",
            background: "#fffaf6",
            padding: 56,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 24, color: "#9b7c68" }}>Frizerski salon | Sabac</span>
              <strong style={{ fontSize: 56, lineHeight: 1.05 }}>{SITE_NAME}</strong>
            </div>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 112,
                height: 112,
                borderRadius: 56,
                background: "#241f1b",
                color: "#fffaf6",
                fontSize: 32,
                fontWeight: 700,
              }}
            >
              SLG
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 850 }}>
            <h1 style={{ fontSize: 68, lineHeight: 1.02, margin: 0 }}>
              Premium nega kose, koloracije, keratin i proizvodi za dugotrajan rezultat.
            </h1>
            <p style={{ fontSize: 28, lineHeight: 1.25, margin: 0, color: "#5b514a" }}>
              Oporavak ostecene i blajhane kose, glam frizure i profesionalna rutina za kucnu negu.
            </p>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
