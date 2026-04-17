import PageSkeleton from "@/src/components/admin/ui/PageSkeleton";

// Skeleton del dashboard principal — aparece INMEDIATAMENTE al navegar aquí
export default function DashboardLoading() {
  return <PageSkeleton statsGrid blocks={2} />;
}
