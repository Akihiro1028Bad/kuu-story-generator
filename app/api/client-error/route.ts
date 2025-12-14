import { NextResponse } from "next/server";

type ClientErrorPayload = {
  type?: "error" | "unhandledrejection" | "global-error";
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
  timestamp?: string;
  extra?: Record<string, unknown>;
};

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const userAgent = req.headers.get("user-agent") ?? undefined;
  const forwardedFor = req.headers.get("x-forwarded-for") ?? undefined;
  const ray = req.headers.get("x-vercel-id") ?? req.headers.get("cf-ray") ?? undefined;

  const bodyText = await req.text();
  const trimmed = bodyText.slice(0, 50_000);
  const parsed = safeJsonParse(trimmed);

  const payload: ClientErrorPayload =
    parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as ClientErrorPayload) : {};

  const log = {
    ray,
    forwardedFor,
    userAgent,
    receivedAt: new Date().toISOString(),
    payload: {
      ...payload,
      // Prefer server-derived UA in case client omitted/spoofed it.
      userAgent: payload.userAgent ?? userAgent,
    },
    truncated: bodyText.length > trimmed.length,
  };

  console.error("[client-error]", log);

  return NextResponse.json({ ok: true });
}

