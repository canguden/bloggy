"use client";

import { useEffect } from "react";

/**
 * Replaces the entire root layout when it — not just a page — throws, so it
 * must render its own <html>/<body>. Deliberately plain: this is the last
 * line of defense and shouldn't depend on anything that could also fail.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled error in root layout", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
            padding: "6rem 1.5rem",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#0A0A0A" }}>Something went wrong</h2>
          <p style={{ fontSize: "13.5px", color: "#525252", maxWidth: "24rem" }}>
            Bloggy hit a problem loading the app. Try again.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "0.5rem",
              height: "2rem",
              padding: "0 1rem",
              borderRadius: "999px",
              border: "1px solid #D9D9D9",
              background: "transparent",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
