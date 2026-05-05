// POST /api/revalidate
//
// Webhook endpoint hit by WebZítra after a content save. Verifies the
// HMAC-SHA256 signature using WEBZITRA_WEBHOOK_SECRET (set in Vercel
// project env from the project_content row's webhook_secret), then
// invalidates the next/cache tag the layout's getWebzitraContent()
// fetch is keyed against. Without a successful revalidate, content
// changes still propagate to the page within ISR window (60 s) — the
// webhook just makes them appear immediately.

import crypto from "node:crypto";
import { revalidateTag } from "next/cache";

const SECRET = process.env.WEBZITRA_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!SECRET) {
    return Response.json(
      { error: "WEBZITRA_WEBHOOK_SECRET not configured" },
      { status: 503 },
    );
  }

  const sigHeader = req.headers.get("x-webzitra-signature") ?? "";
  const body = await req.text();

  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(body)
    .digest("hex");

  if (
    sigHeader.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sigHeader), Buffer.from(expected))
  ) {
    return Response.json({ error: "bad signature" }, { status: 401 });
  }

  let payload: { projectId?: string; version?: number };
  try {
    payload = JSON.parse(body);
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!payload.projectId) {
    return Response.json({ error: "missing projectId" }, { status: 400 });
  }

  // Next.js 16 requires a cache-life profile here. "default" is the
  // built-in profile that matches the layout's `revalidate: 60` fetch
  // tag — invalidating it forces the next request to refetch.
  revalidateTag(`content:${payload.projectId}`, "default");
  return Response.json({
    revalidated: true,
    projectId: payload.projectId,
    version: payload.version,
  });
}
