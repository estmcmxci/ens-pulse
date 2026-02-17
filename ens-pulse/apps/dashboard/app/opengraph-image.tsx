import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "ENS Pulse — DAO Monitor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const fontsDir = join(process.cwd(), "public", "fonts");
  const [mediumData, thinData, boldData] = await Promise.all([
    readFile(join(fontsDir, "ABCMonumentGrotesk-Medium.otf")),
    readFile(join(fontsDir, "ABCMonumentGrotesk-Thin.otf")),
    readFile(join(fontsDir, "ABCMonumentGrotesk-Bold.otf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#06060a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Atmospheric gradient background */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            background: "radial-gradient(ellipse 80% 60% at 70% 50%, rgba(82,152,255,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            background: "radial-gradient(ellipse 50% 80% at 30% 60%, rgba(160,153,255,0.06) 0%, transparent 60%)",
          }}
        />

        {/* Concentric rings — observatory radar element */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: "-40px",
            width: "520px",
            height: "520px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "translateY(-50%)",
            opacity: 0.12,
          }}
        >
          {[420, 340, 260, 180].map((s, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: `${s}px`,
                height: `${s}px`,
                borderRadius: "50%",
                border: "1px solid rgba(82,152,255,0.6)",
                display: "flex",
              }}
            />
          ))}
          {/* Center dot */}
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#5298ff",
              display: "flex",
            }}
          />
        </div>

        {/* ENS icon — top-right watermark */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            right: "56px",
            display: "flex",
            opacity: 0.15,
          }}
        >
          <svg width="80" height="92" viewBox="0 0 202 231" fill="none">
            <path
              d="M98.3592 2.79449L34.8353 106.98C34.3371 107.797 33.1797 107.888 32.5617 107.157C26.9693 100.537 6.13479 72.38 31.9154 46.7157C55.4403 23.2971 85.4045 6.60004 96.5096 0.829212C97.7695 0.174482 99.0966 1.58512 98.3592 2.79449Z"
              fill="#5298FF"
            />
            <path
              d="M94.8464 229.639C96.1142 230.524 97.6763 229.015 96.8266 227.727C82.6379 206.216 35.4718 134.643 28.9564 123.899C22.53 113.302 9.89025 95.69 8.83583 80.6222C8.73059 79.118 6.64381 78.8125 6.11887 80.2271C5.27227 82.5085 4.37094 85.2315 3.53091 88.3421C-7.07378 127.608 8.32747 169.276 41.7758 192.612L94.8464 229.64V229.639Z"
              fill="#5298FF"
            />
            <path
              d="M103.571 227.786L167.095 123.601C167.593 122.784 168.751 122.693 169.369 123.424C174.961 130.042 195.796 158.201 170.015 183.865C146.49 207.283 116.526 223.981 105.421 229.751C104.161 230.406 102.834 228.996 103.571 227.786Z"
              fill="#5298FF"
            />
            <path
              d="M107.154 0.927948C105.886 0.0434556 104.324 1.55186 105.174 2.83999C119.363 24.3512 166.529 95.9239 173.044 106.668C179.471 117.265 192.11 134.877 193.165 149.945C193.27 151.449 195.357 151.754 195.882 150.34C196.728 148.058 197.63 145.336 198.47 142.225C209.074 102.959 193.673 61.2915 160.225 37.9549L107.154 0.927948Z"
              fill="#5298FF"
            />
          </svg>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            height: "100%",
            padding: "72px 80px",
            position: "relative",
          }}
        >
          {/* LIVE indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#22c55e",
                display: "flex",
              }}
            />
            <span
              style={{
                fontFamily: "Monument Grotesk",
                fontSize: "14px",
                fontWeight: 500,
                color: "#22c55e",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Live Monitoring
            </span>
          </div>

          {/* Title */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "20px" }}>
            <span
              style={{
                fontFamily: "Monument Grotesk",
                fontSize: "120px",
                fontWeight: 700,
                color: "#fafafa",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              PULSE
            </span>
            <span
              style={{
                fontFamily: "Monument Grotesk",
                fontSize: "28px",
                fontWeight: 100,
                color: "rgba(250,250,250,0.5)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              DAO Monitor
            </span>
          </div>

          {/* Gradient divider */}
          <div
            style={{
              display: "flex",
              width: "560px",
              height: "2px",
              marginTop: "28px",
              marginBottom: "28px",
              background: "linear-gradient(90deg, #5298ff 0%, #a099ff 50%, transparent 100%)",
              borderRadius: "1px",
            }}
          />

          {/* Tagline */}
          <p
            style={{
              fontFamily: "Monument Grotesk",
              fontSize: "22px",
              fontWeight: 100,
              color: "#a1a1aa",
              lineHeight: 1.5,
              maxWidth: "560px",
              margin: 0,
            }}
          >
            Real-time context for ENS governance decisions. Never vote on a proposal without understanding the world it
            exists in.
          </p>

          {/* Signal categories */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "36px",
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Proposals", color: "#5298ff" },
              { label: "Treasury", color: "#22c55e" },
              { label: "Delegates", color: "#a099ff" },
              { label: "Metrics", color: "#e8a946" },
              { label: "Forum", color: "#f59e0b" },
              { label: "Security", color: "#ef4444" },
            ].map(({ label, color }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: `1px solid ${color}33`,
                  background: `${color}0a`,
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: color,
                    display: "flex",
                  }}
                />
                <span
                  style={{
                    fontFamily: "Monument Grotesk",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: color,
                    letterSpacing: "0.05em",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom border gradient */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            display: "flex",
            background: "linear-gradient(90deg, transparent 0%, #5298ff 30%, #a099ff 70%, transparent 100%)",
          }}
        />

        {/* Top subtle line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            display: "flex",
            background: "linear-gradient(90deg, transparent 0%, rgba(82,152,255,0.3) 50%, transparent 100%)",
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Monument Grotesk", data: thinData, weight: 100, style: "normal" },
        { name: "Monument Grotesk", data: mediumData, weight: 500, style: "normal" },
        { name: "Monument Grotesk", data: boldData, weight: 700, style: "normal" },
      ],
    },
  );
}
