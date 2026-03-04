import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  // Load user services from DB
  const userServices = await prisma.userService.findMany({
    where: { userId: session.user.id },
    select: {
      service: { select: { id: true, name: true } },
    },
  });

  const serviceNames = userServices.map((us) => us.service.name);

  return (
    <DashboardShell
      userName={session.user.name}
      serviceNames={serviceNames}
      role={session.user.role}
    >
      {children}
    </DashboardShell>
  );
}
