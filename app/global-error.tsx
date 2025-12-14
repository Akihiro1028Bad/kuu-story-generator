"use client";

import { useEffect } from "react";

function getNextBuildId(): string | undefined {
  try {
    const data = (window as any).__NEXT_DATA__;
    return typeof data?.buildId === "string" ? data.buildId : undefined;
  } catch {
    return undefined;
  }
}

function sendGlobalError(error: Error & { digest?: string }) {
  const payload = {
    type: "global-error" as const,
    name: error.name,
    message: error.message,
    stack: error.stack,
    errorDigest: error.digest,
    href: typeof location !== "undefined" ? location.href : undefined,
    referrer: typeof document !== "undefined" ? document.referrer : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    nextBuildId: getNextBuildId(),
    timestamp: new Date().toISOString(),
  };

  const body = JSON.stringify(payload);
  const endpoint = "/api/client-error";

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
      return;
    }
  } catch {
    // Fall through.
  }

  try {
    fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Ignore.
  }
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    sendGlobalError(error);
  }, [error]);

  return (
    <html lang="ja">
      <body style={{ fontFamily: "system-ui, -apple-system, sans-serif", padding: 24 }}>
        <h2 style={{ margin: "0 0 8px" }}>エラーが発生しました</h2>
        <p style={{ margin: "0 0 16px", color: "#555" }}>
          しばらくしてから再読み込みするか、問題が続く場合はサポートに連絡してください。
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          再試行
        </button>
      </body>
    </html>
  );
}

