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

let logoWhiteDataUri: string | null = null;
async function getLogoWhiteDataUri(): Promise<string> {
  if (!logoWhiteDataUri) {
    // A pre-shrunk (300x108, ~2x the 150x54 display size) asset, not the full
    // 659x237 source — Satori's image scaling has no anti-aliasing, so
    // handing it a steep ~4.4x downscale (from the full source) produced
    // visibly jagged edges. A gentle ~2x downscale renders crisp.
    const buf = await readFile(path.join(process.cwd(), "public/og/logo-white.png"));
    logoWhiteDataUri = `data:image/png;base64,${buf.toString("base64")}`;
  }
  return logoWhiteDataUri;
}

let tennisBallDataUri: string | null = null;
async function getTennisBallDataUri(): Promise<string> {
  if (!tennisBallDataUri) {
    // Satori can't render the 🎾 glyph itself (no system emoji font, and its
    // own emoji-set fallbacks — twemoji/noto/etc. — all look visibly
    // different from what a real browser shows). This is a PNG export of the
    // actual emoji glyph instead, captured once from a real browser render.
    const buf = await readFile(path.join(process.cwd(), "public/og/tennis-ball.png"));
    tennisBallDataUri = `data:image/png;base64,${buf.toString("base64")}`;
  }
  return tennisBallDataUri;
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
          // No overflow:hidden here — Satori clips a rotated absolutely-positioned
          // child (the court block below) against its PRE-rotation bounding box
          // when the parent has overflow:hidden, cutting it off well short of
          // where it visually should bleed off-canvas. The 1200x630 ImageResponse
          // canvas itself is the true boundary regardless, since this div is
          // sized to exactly match it — so omitting overflow:hidden is safe here.
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
            transformOrigin: "center",
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
          <div style={{ position: "absolute", left: "26%", top: 24, bottom: 24, width: 2, background: "rgba(255,255,255,.45)", display: "flex" }} />
          <div style={{ position: "absolute", left: "74%", top: 24, bottom: 24, width: 2, background: "rgba(255,255,255,.45)", display: "flex" }} />
          <div style={{ position: "absolute", left: "26%", right: "26%", top: "50%", height: 2, marginTop: -1, background: "rgba(255,255,255,.45)", display: "flex" }} />
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

export interface AgendaOgFeatured {
  day: string;
  month: string;
  title: string;
  meta: string;
}

/**
 * Share card for the Agenda page (/) specifically — dark, per the Claude
 * Design "OG Image Agenda" hand-off. Deliberately NOT the static PNG that
 * hand-off shipped: its own README flags that a static image goes stale the
 * moment the featured date/event changes, and recommends rendering it from
 * live data instead — this does exactly that, reusing the same upcoming-event
 * lookup the Agenda page itself uses.
 */
export async function renderAgendaOgCard(featured: AgendaOgFeatured | null) {
  const [logoSrc, ballSrc, fonts] = await Promise.all([getLogoWhiteDataUri(), getTennisBallDataUri(), getFonts()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          background: "#0E2318",
          fontFamily: '"Plus Jakarta Sans"',
          color: "#FFFFFF",
        }}
      >
        <svg viewBox="0 0 1200 630" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <path
            d="M-40 544 C 180 504 380 496 560 520 C 740 544 900 542 1060 500 C 1140 478 1200 454 1240 434"
            fill="none"
            stroke="#D2E95C"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="17 26"
            opacity=".28"
          />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ballSrc}
          alt=""
          width={34}
          height={34}
          style={{ position: "absolute", left: 560, top: 520, transform: "translate(-50%, -50%)" }}
        />

        <div
          style={{
            position: "relative",
            height: "100%",
            width: "100%",
            boxSizing: "border-box",
            padding: "52px 60px",
            display: "flex",
            alignItems: "center",
            gap: 48,
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 22, minWidth: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="" width={150} height={54} style={{ alignSelf: "flex-start" }} />
            <h1 style={{ margin: 0, fontSize: 68, fontWeight: 800, letterSpacing: "-.04em", lineHeight: 0.96, maxWidth: 560, display: "flex" }}>
              Elke zondag padellen
            </h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#D2E95C", display: "flex" }}>Agenda · padelsocial.nl</span>
              <span
                style={{
                  fontSize: 21,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: "rgba(255,255,255,.82)",
                  maxWidth: 460,
                  display: "flex",
                }}
              >
                Kies je datum en speel mee, ook zonder vaste partner.
              </span>
            </div>
          </div>

          <div style={{ width: 440, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {featured ? (
              <div
                style={{
                  width: 440,
                  boxSizing: "border-box",
                  background: "#FFFFFF",
                  borderRadius: 26,
                  padding: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  color: "#0E2318",
                }}
              >
                <span
                  style={{
                    width: 62,
                    height: 66,
                    borderRadius: 16,
                    background: "#F1F5EF",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.03em", color: "#0E2318", display: "flex" }}>{featured.day}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".12em", color: "#0E2318", display: "flex" }}>{featured.month}</span>
                </span>
                <span style={{ width: 322, flexShrink: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: ".10em", textTransform: "uppercase", color: "#4F6E14", display: "flex" }}>
                    Volgende event
                  </span>
                  <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.1, display: "flex" }}>{featured.title}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#43584C", display: "flex", whiteSpace: "nowrap" }}>{featured.meta}</span>
                </span>
              </div>
            ) : (
              <div style={{ background: "#FFFFFF", borderRadius: 26, padding: 24, display: "flex", flexDirection: "column", gap: 6, color: "#0E2318" }}>
                <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: ".10em", textTransform: "uppercase", color: "#4F6E14", display: "flex" }}>
                  Volgende event
                </span>
                <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.1, display: "flex" }}>Datum volgt</span>
                <span style={{ fontSize: 17, fontWeight: 600, color: "#43584C", display: "flex" }}>Check de WhatsApp-groep</span>
              </div>
            )}

            <div
              style={{
                background: "rgba(255,255,255,.12)",
                border: "2px solid rgba(255,255,255,.16)",
                borderRadius: 22,
                padding: "18px 22px",
                display: "flex",
                alignItems: "center",
                gap: 18,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: ".10em", textTransform: "uppercase", color: "#D2E95C", flexShrink: 0, display: "flex" }}>
                Wekelijks
              </span>
              <span style={{ fontSize: 19, fontWeight: 700, display: "flex" }}>Up &amp; Down/King of the Court</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts }
  );
}
