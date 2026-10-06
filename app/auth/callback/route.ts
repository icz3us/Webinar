import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next")?.startsWith("/") ? url.searchParams.get("next")! : "/#register";
  const supabase = await createClient();
  if (!code || !supabase) return NextResponse.redirect(new URL("/?auth=oauth_error", url.origin));
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(error ? "/?auth=oauth_error" : next, url.origin));
}

