import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/connexion");
  }

  return (
    <DashboardShell
      userName={session.user.name}
      serviceName={(session.user as any).serviceName}
    >
      {children}
    </DashboardShell>
  );
}
