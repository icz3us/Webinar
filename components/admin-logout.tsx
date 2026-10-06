"use client";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
export default function AdminLogout(){const[busy,setBusy]=useState(false);async function logout(){setBusy(true);const supabase=createClient();if(supabase)await supabase.auth.signOut();location.assign("/login")}return <button className="admin-logout" type="button" onClick={logout} disabled={busy}><LogOut aria-hidden="true"/><span>{busy?"Signing out":"Log out"}</span></button>}

