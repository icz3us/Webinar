import { requireStaff } from "@/lib/auth";
import AdminShell from "@/components/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();
  return <AdminShell user={user}>{children}</AdminShell>;
}
