import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/connexion");
  }

  // Only participants use this layout; others go to the dashboard
  if (session.user.role !== "PARTICIPANT") {
    redirect("/tableau-de-bord");
  }

  return (
    <DashboardShell
      userName={session.user.name}
      serviceName={null}
      role={session.user.role}
    >
      {children}
    </DashboardShell>
  );
}
