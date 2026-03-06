import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserServiceIds } from "@/lib/authorization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, MessageSquare, TrendingUp, BarChart3, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { ServiceFilter } from "@/components/dashboard/service-filter";
import { ServiceKPITable } from "@/components/dashboard/service-kpi-table";
import { Role } from "@prisma/client";

interface DashboardPageProps {
  searchParams: Promise<{ serviceId?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { serviceId } = await searchParams;
  const session = await auth();
  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  // Build where clause based on role
  const activityWhere: any = {};
  if (userRole === Role.RESPONSABLE_SERVICE && userId) {
    const serviceIds = await getUserServiceIds(userId);
    activityWhere.serviceId = { in: serviceIds };
  } else if (userRole === Role.INTERVENANT) {
    activityWhere.intervenantId = userId;
  }
  // ADMIN: no filter (sees all)

  // Apply serviceId filter
  if (serviceId) {
    activityWhere.serviceId = serviceId;
  }

  const [activitiesCount, attendancesCount, feedbacksCount, recentActivities, recommendCount] =
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
        orderBy: { startDate: "desc" },
        take: 5,
        include: {
          _count: { select: { attendances: true, feedbacks: true } },
        },
      }),
      prisma.feedback.count({
        where: { activity: activityWhere, wouldRecommend: true },
      }),
    ]);

  const avgRating = await prisma.feedback.aggregate({
    where: { activity: activityWhere },
    _avg: { overallRating: true },
  });

  const feedbackRate = attendancesCount > 0
    ? Math.round((feedbacksCount / attendancesCount) * 100)
    : 0;

  const recommendationRate = feedbacksCount > 0
    ? Math.round((recommendCount / feedbacksCount) * 100)
    : 0;

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
    {
      title: "Taux de feedback",
      value: feedbackRate + "%",
      icon: BarChart3,
      color: "text-[#10b981]",
      bg: "bg-[#10b981]/10",
    },
    {
      title: "Recommandation",
      value: recommendationRate + "%",
      icon: ThumbsUp,
      color: "text-[#8b5cf6]",
      bg: "bg-[#8b5cf6]/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble {userRole === Role.ADMIN ? "globale" : "de vos services"}
          </p>
        </div>
        {(userRole === Role.ADMIN || userRole === Role.RESPONSABLE_SERVICE) && (
          <Button asChild>
            <Link href="/activites/nouvelle">Nouvelle activité</Link>
          </Button>
        )}
      </div>

      {/* Service Filter */}
      <ServiceFilter />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Service KPI Table */}
      <ServiceKPITable />

      {/* Charts */}
      <DashboardCharts serviceId={serviceId} />

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
                      {new Date(activity.startDate).toLocaleDateString("fr-FR", {
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
