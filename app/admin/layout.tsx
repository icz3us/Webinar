import { BarChart3, CalendarCheck, FileBadge, Settings, Users } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import AdminLogout from "@/components/admin-logout";

export const dynamic = "force-dynamic";

export default async function AdminLayout({children}:{children:React.ReactNode}){const user=await requireStaff();return <div className="admin-shell"><aside className="admin-sidebar"><a className="admin-brand" href="/admin">DDT <span>CONTROL</span></a><nav><a href="/admin"><BarChart3/>Overview</a><a href="/admin/registrations"><Users/>Registrations</a><a href="/admin/attendance"><CalendarCheck/>Attendance</a><a href="/admin/certificates"><FileBadge/>Certificates</a><a href="/admin/settings"><Settings/>Settings</a></nav><div className="admin-user"><b>{user.role}</b><span>{user.email}</span><AdminLogout/></div></aside><div className="admin-main"><header><div><span>EVENT / 001</span><strong>Deepfakes &amp; Digital Trust</strong></div><a href="/">Public page</a></header>{children}</div></div>}
