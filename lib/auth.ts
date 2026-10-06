import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireStaff() {
  const supabase = await createClient();
  if (!supabase) return { id: "demo-admin", email: "admin@demo.local", role: "admin" as const };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const trustedRole = user.app_metadata?.role;
  if (trustedRole === "admin" || trustedRole === "staff") return { id: user.id, email: user.email ?? "", role: trustedRole as "admin" | "staff" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "staff"].includes(profile.role)) redirect("/login?error=forbidden");
  return { id: user.id, email: user.email ?? "", role: profile.role as "admin" | "staff" };
}
