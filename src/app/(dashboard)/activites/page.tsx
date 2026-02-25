import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, CalendarDays, Users, MessageSquare, MapPin } from "lucide-react";
import { Role } from "@prisma/client";

const statusLabels: Record<string, { label: string; variant: "default" | "success" | "warning" | "secondary" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  ACTIVE: { label: "Active", variant: "success" },
  CLOSED: { label: "Clôturée", variant: "warning" },
};

export default async function ActivitiesPage() {
  const session = await auth();
  const userRole = session?.user?.role;
  const serviceId = session?.user?.serviceId;

  // Build where clause based on role
  const where: any = {};
  if (userRole === Role.RESPONSABLE_SERVICE && serviceId) {
    where.serviceId = serviceId;
  } else if (userRole === Role.INTERVENANT) {
    where.intervenantId = session?.user?.id;
  }
  // ADMIN: no filter

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      _count: { select: { attendances: true, feedbacks: true } },
      createdBy: { select: { name: true } },
      service: { select: { name: true } },
    },
  });

  const canCreate = userRole === Role.ADMIN || userRole === Role.RESPONSABLE_SERVICE;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activités</h1>
          <p className="text-muted-foreground">
            {userRole === Role.ADMIN ? "Toutes les activités" : "Activités de votre service"}
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/activites/nouvelle">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle activité
            </Link>
          </Button>
        )}
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Aucune activité</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {canCreate ? "Commencez par créer votre première activité" : "Aucune activité disponible"}
            </p>
            {canCreate && (
              <Button asChild className="mt-4">
                <Link href="/activites/nouvelle">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une activité
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {activities.map((activity) => {
            const status = statusLabels[activity.status];
            return (
              <Link key={activity.id} href={`/activites/${activity.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{activity.title}</h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {new Date(activity.date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                          {activity.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {activity.location}
                            </span>
                          )}
                          <span className="text-xs">{activity.service.name}</span>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-1 text-[#2980B9]">
                          <Users className="h-4 w-4" />
                          {activity._count.attendances}
                        </span>
                        <span className="flex items-center gap-1 text-[#D4A017]">
                          <MessageSquare className="h-4 w-4" />
                          {activity._count.feedbacks}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
