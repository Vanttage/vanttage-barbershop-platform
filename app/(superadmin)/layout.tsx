import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Sidebar from "@/src/components/admin/dashboard/Sidebar";
import DashboardShell from "@/src/components/admin/dashboard/DashboardShell";
import { authOptions } from "@/src/lib/auth";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "superadmin") {
    redirect("/dashboard");
  }

  return (
    <DashboardShell>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </DashboardShell>
  );
}
