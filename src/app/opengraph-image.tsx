import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "StyleSync — Turn any website into a living design system";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background:
            "linear-gradient(135deg, #0b0d14 0%, #1f1147 50%, #0f172a 100%)",
          padding: 72,
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 64,
            left: 72,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background:
                "linear-gradient(135deg, #6366f1, #ec4899, #06b6d4)",
            }}
          />
          StyleSync
        </div>
        <div
          style={{
            position: "absolute",
            right: 72,
            top: 220,
            display: "flex",
            gap: 18,
          }}
        >
          {[
            "#6366f1",
            "#ec4899",
            "#06b6d4",
            "#fbbf24",
            "#10b981",
          ].map((hex) => (
            <div
              key={hex}
              style={{
                width: 96,
                height: 96,
                borderRadius: 14,
                background: hex,
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          Turn any website into
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            backgroundImage:
              "linear-gradient(90deg, #818cf8, #f472b6, #22d3ee)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          a living design system.
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 26,
            color: "#a5b4cf",
          }}
        >
          Paste a URL. Lock the tokens you love. Export anywhere.
        </div>
      </div>
    ),
    { ...size },
  );
}
