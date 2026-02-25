import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, MessageSquare, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardCharts } from "@/components/dashboard/charts";
import { Role } from "@prisma/client";

export default async function DashboardPage() {
  const session = await auth();
  const userRole = session?.user?.role;
  const serviceId = session?.user?.serviceId;

  // Build where clause based on role
  const activityWhere: any = {};
  if (userRole === Role.RESPONSABLE_SERVICE && serviceId) {
    activityWhere.serviceId = serviceId;
  } else if (userRole === Role.INTERVENANT) {
    activityWhere.intervenantId = session?.user?.id;
  }
  // ADMIN: no filter (sees all)

  const [activitiesCount, attendancesCount, feedbacksCount, recentActivities] =
    await Promise.all([
      prisma.activity.count({ where: activityWhere }),
      prisma.attendance.count({
        where: { activity: activityWhere },
      }),
      prisma.feedback.count({
        where: { activity: activityWhere },
      }),
      prisma.activity.findMany({
        where: activityWhere,
        orderBy: { date: "desc" },
        take: 5,
        include: {
          _count: { select: { attendances: true, feedbacks: true } },
        },
      }),
    ]);

  const avgRating = await prisma.feedback.aggregate({
    where: { activity: activityWhere },
    _avg: { overallRating: true },
  });

  const stats = [
    {
      title: "Activités",
      value: activitiesCount,
      icon: CalendarDays,
      color: "text-[#2980B9]",
      bg: "bg-[#2980B9]/10",
    },
    {
      title: "Présences",
      value: attendancesCount,
      icon: Users,
      color: "text-[#14355A]",
      bg: "bg-[#14355A]/10",
    },
    {
      title: "Feedbacks",
      value: feedbacksCount,
      icon: MessageSquare,
      color: "text-[#7DD3D0]",
      bg: "bg-[#7DD3D0]/20",
    },
    {
      title: "Note moyenne",
      value: avgRating._avg.overallRating
        ? avgRating._avg.overallRating.toFixed(1) + "/5"
        : "N/A",
      icon: TrendingUp,
      color: "text-[#D4A017]",
      bg: "bg-[#D4A017]/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble {userRole === Role.ADMIN ? "globale" : "de votre service"}
          </p>
        </div>
        {(userRole === Role.ADMIN || userRole === Role.RESPONSABLE_SERVICE) && (
          <Button asChild>
            <Link href="/activites/nouvelle">Nouvelle activité</Link>
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-md p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts serviceId={serviceId ?? undefined} />

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activités récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune activité pour le moment.{" "}
              <Link href="/activites/nouvelle" className="text-primary underline">
                Créer une activité
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/activites/${activity.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{activity._count.attendances} présences</span>
                    <span>{activity._count.feedbacks} retours</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
