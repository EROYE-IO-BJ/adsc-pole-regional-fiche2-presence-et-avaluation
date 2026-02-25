import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { QRCodeSection } from "@/components/partage/qr-code-section";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const serviceId = (session?.user as any)?.serviceId;

  const activity = await prisma.activity.findFirst({
    where: { id, serviceId },
    select: { id: true, title: true, accessToken: true, date: true },
  });

  if (!activity) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/activites/${activity.id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Partager</h1>
          <p className="text-muted-foreground">{activity.title}</p>
        </div>
      </div>

      <QRCodeSection accessToken={activity.accessToken} activityTitle={activity.title} />
    </div>
  );
}
