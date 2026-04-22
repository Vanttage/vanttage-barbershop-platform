import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Sidebar from "@/src/components/admin/dashboard/Sidebar";
import DashboardShell from "@/src/components/admin/dashboard/DashboardShell";
import { authOptions } from "@/src/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (!["owner", "superadmin"].includes(session.user.role)) redirect("/");

  return (
    <div className="relative isolate min-h-screen bg-[#09090B] text-white">
      {/* Fondo SaaS (UNA sola vez) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.055),transparent_34%)]" />
        <div className="absolute left-[-10%] top-[-8%] h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/[0.08] blur-3xl" />
        <div className="absolute bottom-[-12%] right-[-10%] h-[26rem] w-[26rem] rounded-full bg-cyan-500/[0.06] blur-3xl" />
      </div>

      <DashboardShell>
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </DashboardShell>
    </div>
  );
}
