import { NextResponse } from "next/server";
import { syncLastfm } from "@/lib/lastfm";

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const result = await syncLastfm(1);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
