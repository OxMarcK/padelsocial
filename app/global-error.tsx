"use client";

/**
 * error.tsx only catches crashes inside a route segment — a crash in the
 * root layout itself needs this instead (replaces <html>/<body> too, so no
 * shared layout/fonts to lean on here, hence the inline styles).
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="nl">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "24px",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
            color: "#0E2318",
            background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)",
          }}
        >
          <div>
            <div style={{ fontSize: "24px", fontWeight: 700 }}>Even een misser…</div>
            <p style={{ marginTop: "4px", fontSize: "14px", color: "#5C7266" }}>Kan gebeuren., geen stress</p>
          </div>
          <button
            onClick={reset}
            style={{
              borderRadius: "999px",
              background: "#0E2318",
              color: "#FFFFFF",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            Probeer opnieuw
          </button>
        </div>
      </body>
    </html>
  );
}
