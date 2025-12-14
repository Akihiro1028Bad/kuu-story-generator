"use client";

import { useEffect } from "react";

type ClientErrorPayload = {
  type: "error" | "unhandledrejection" | "global-error";
  message?: string;
  name?: string;
  stack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  href?: string;
  referrer?: string;
  userAgent?: string;
  nextBuildId?: string;
  errorDigest?: string;
  timestamp: string;
  extra?: Record<string, unknown>;
};

function getNextBuildId(): string | undefined {
  try {
    const data = (window as { __NEXT_DATA__?: { buildId?: string } }).__NEXT_DATA__;
    return typeof data?.buildId === "string" ? data.buildId : undefined;
  } catch {
    return undefined;
  }
}

function toErrorDetails(input: unknown): { name?: string; message?: string; stack?: string } {
  if (input instanceof Error) {
    return { name: input.name, message: input.message, stack: input.stack };
  }
  if (typeof input === "string") {
    return { message: input };
  }
  try {
    return { message: JSON.stringify(input) };
  } catch {
    return { message: String(input) };
  }
}

function sendPayload(endpoint: string, payload: ClientErrorPayload) {
  const body = JSON.stringify(payload);

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
      return;
    }
  } catch {
    // Fall through to fetch.
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

export function ClientErrorReporter({ endpoint = "/api/client-error" }: { endpoint?: string }) {
  useEffect(() => {
    const seen = new Map<string, number>();
    const now = () => Date.now();
    const shouldSend = (key: string) => {
      const last = seen.get(key);
      const t = now();
      if (last && t - last < 10_000) return false;
      seen.set(key, t);
      return true;
    };

    const base = (): Pick<
      ClientErrorPayload,
      "href" | "referrer" | "userAgent" | "nextBuildId" | "timestamp"
    > => ({
      href: typeof location !== "undefined" ? location.href : undefined,
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      nextBuildId: getNextBuildId(),
      timestamp: new Date().toISOString(),
    });

    const onError = (event: ErrorEvent) => {
      const details = toErrorDetails(event.error ?? event.message);
      const payload: ClientErrorPayload = {
        type: "error",
        ...base(),
        ...details,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      };

      const key = [payload.message, payload.stack, payload.source, payload.lineno, payload.colno, payload.href]
        .filter((v) => v != null)
        .join("|");
      if (shouldSend(key)) sendPayload(endpoint, payload);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const details = toErrorDetails(event.reason);
      const payload: ClientErrorPayload = { type: "unhandledrejection", ...base(), ...details };

      const key = [payload.message, payload.stack, payload.href].filter((v) => v != null).join("|");
      if (shouldSend(key)) sendPayload(endpoint, payload);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [endpoint]);

  return null;
}

