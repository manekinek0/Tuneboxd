import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth and email-confirmation redirect target: exchanges the code for a session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
  }
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
