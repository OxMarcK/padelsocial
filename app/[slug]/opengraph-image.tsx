import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/server";
import { repo } from "@/lib/data";
import { sessionsRepo } from "@/lib/data/sessions";
import { fmtDateShort } from "@/lib/share-metadata";

/**
 * Per-event/session share-card image — same visual language as the rest of the
 * mint theme (gradient background, lime logo mark, dark-green title). Runs on
 * Node (not edge) so the logo PNG can be read straight off disk instead of an
 * extra network fetch. Next auto-wires this as the og:image (and twitter:image,
 * since no separate twitter-image file exists) for every /{slug} page —
 * overriding the static fallback set in generateMetadata for this route.
 */
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const event = await repo.getEventBySlug(params.slug);
  const session = event ? null : await sessionsRepo.getSessionBySlug(params.slug);

  const title = event?.name ?? session?.title ?? "Padel Social";
  const meta = event
    ? `${fmtDateShort(event.date, event.startTime)} · ${event.location}`
    : session
      ? `${fmtDateShort(session.date, session.startTime)} · ${session.location}`
      : null;

  const logoData = await readFile(path.join(process.cwd(), "public/logo/S.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={220} height={76} alt="" />

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: title.length > 24 ? 64 : 84,
              fontWeight: 700,
              color: "#0E2318",
              lineHeight: 1.05,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          {meta ? <div style={{ fontSize: 34, fontWeight: 600, color: "#5C7266" }}>{meta}</div> : null}
        </div>
      </div>
    ),
    size
  );
}
