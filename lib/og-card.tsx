import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/server";

/**
 * Shared share-card renderer for both / and /{slug} — built from the Claude
 * Design hand-off (see the "og-image-6a" assets): white header bar with logo,
 * a fixed decorative court illustration (NOT driven by real reservation data —
 * purely branding), a lime accent circle, and a bottom-aligned text block.
 * Runs on Node (not edge) so the logo/fonts can be read straight off disk
 * instead of an extra network fetch per request.
 */
export const OG_SIZE = { width: 1200, height: 630 };

let logoDataUri: string | null = null;
async function getLogoDataUri(): Promise<string> {
  if (!logoDataUri) {
    const buf = await readFile(path.join(process.cwd(), "public/logo/S.png"));
    logoDataUri = `data:image/png;base64,${buf.toString("base64")}`;
  }
  return logoDataUri;
}

let fontsPromise: Promise<{ name: string; data: Buffer; weight: 500 | 700 | 800; style: "normal" }[]> | null = null;
function getFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      readFile(path.join(process.cwd(), "assets/fonts/PlusJakartaSans-500.ttf")),
      readFile(path.join(process.cwd(), "assets/fonts/PlusJakartaSans-700.ttf")),
      readFile(path.join(process.cwd(), "assets/fonts/PlusJakartaSans-800.ttf")),
    ]).then(([w500, w700, w800]) => [
      { name: "Plus Jakarta Sans", data: w500, weight: 500 as const, style: "normal" as const },
      { name: "Plus Jakarta Sans", data: w700, weight: 700 as const, style: "normal" as const },
      { name: "Plus Jakarta Sans", data: w800, weight: 800 as const, style: "normal" as const },
    ]);
  }
  return fontsPromise;
}

/** Steps the title size down so a long name still fits in ~2 lines (98/84/72px per the handoff). */
function titleFontSize(title: string): number {
  if (title.length > 34) return 72;
  if (title.length > 22) return 84;
  return 98;
}

export interface OgCardContent {
  eyebrow: string;
  title: string;
  chips: string[];
}

export async function renderOgCard({ eyebrow, title, chips }: OgCardContent) {
  const [logoSrc, fonts] = await Promise.all([getLogoDataUri(), getFonts()]);
  const fontSize = titleFontSize(title);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          background: "linear-gradient(150deg, #CFE4D7 0%, #E8F1EA 38%, #F5F8F5 68%, #DDEBE0 100%)",
          fontFamily: '"Plus Jakarta Sans"',
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 142, background: "#FFFFFF", display: "flex" }} />

        <div
          style={{
            position: "absolute",
            left: 727,
            top: 74,
            width: 560,
            height: 352,
            borderRadius: 30,
            background: "#1E64F0",
            transform: "rotate(-7deg)",
            overflow: "hidden",
            boxShadow: "0 34px 70px rgba(9,40,90,.28)",
            display: "flex",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 24,
              left: 24,
              right: 24,
              bottom: 24,
              border: "5px solid #FFFFFF",
              borderRadius: 16,
              display: "flex",
            }}
          />
          <div style={{ position: "absolute", left: "50%", top: 24, bottom: 24, width: 4, marginLeft: -2, background: "#FFFFFF", display: "flex" }} />
          <div style={{ position: "absolute", left: "26%", top: 24, bottom: 24, width: 4, background: "#FFFFFF", display: "flex" }} />
          <div style={{ position: "absolute", left: "74%", top: 24, bottom: 24, width: 4, background: "#FFFFFF", display: "flex" }} />
          <div style={{ position: "absolute", left: "26%", right: "26%", top: "50%", height: 4, marginTop: -2, background: "#FFFFFF", display: "flex" }} />
          <div style={{ position: "absolute", left: "12%", top: "22%", width: 28, height: 28, borderRadius: "50%", background: "#D2E95C", display: "flex" }} />
          <div style={{ position: "absolute", left: "12%", bottom: "22%", width: 28, height: 28, borderRadius: "50%", background: "#D2E95C", display: "flex" }} />
          <div style={{ position: "absolute", left: 442, top: "22%", width: 28, height: 28, borderRadius: "50%", background: "#D2E95C", display: "flex" }} />
          <div style={{ position: "absolute", left: "57%", bottom: "22%", width: 28, height: 28, borderRadius: "50%", background: "#D2E95C", display: "flex" }} />
        </div>

        <div
          style={{
            position: "absolute",
            left: -90,
            bottom: -150,
            width: 340,
            height: 340,
            borderRadius: "50%",
            background: "rgba(210,233,92,.34)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "relative",
            height: "100%",
            width: "100%",
            boxSizing: "border-box",
            padding: "42px 64px 54px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20, height: 58 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={251} height={86} alt="" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 26, maxWidth: 700 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.02em", color: "#4F6E14" }}>{eyebrow}</span>
              <span style={{ fontSize, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 0.94, color: "#0E2318" }}>
                {title}
              </span>
            </div>
            {chips.length > 0 ? (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {chips.map((chip, i) => (
                  <span
                    key={i}
                    style={{
                      background: "rgba(255,255,255,.9)",
                      borderRadius: 999,
                      padding: "13px 24px",
                      fontSize: 21,
                      fontWeight: 700,
                      color: "#0E2318",
                      boxShadow: "0 6px 18px rgba(9,60,34,.08)",
                      display: "flex",
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts }
  );
}
