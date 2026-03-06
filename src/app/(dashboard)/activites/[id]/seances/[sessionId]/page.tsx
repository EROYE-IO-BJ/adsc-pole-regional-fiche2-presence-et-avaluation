import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserServiceIds } from "@/lib/authorization";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarDays, MapPin, UserCheck } from "lucide-react";
import Link from "next/link";
import { AttendanceTable } from "@/components/presences/attendance-table";
import { FeedbackList } from "@/components/retours/feedback-list";
import { KpiStats } from "@/components/activites/kpi-stats";
import { Role } from "@prisma/client";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const authSession = await auth();
  const userRole = authSession?.user?.role;
  const userId = authSession?.user?.id;

  // Build activity access filter based on role
  let activityWhere: any = { id };
  if (userRole === Role.RESPONSABLE_SERVICE && userId) {
    const serviceIds = await getUserServiceIds(userId);
    activityWhere.serviceId = { in: serviceIds };
  } else if (userRole === Role.INTERVENANT) {
    activityWhere.intervenantId = userId;
  }

  const session = await prisma.activitySession.findFirst({
    where: { id: sessionId, activityId: id, activity: activityWhere },
    include: {
      activity: {
        include: {
          service: { select: { name: true } },
          program: { select: { id: true, name: true } },
        },
      },
      intervenant: { select: { name: true } },
      attendances: {
        orderBy: { createdAt: "desc" },
        include: { session: { select: { id: true, title: true, date: true } } },
      },
      feedbacks: {
        orderBy: { createdAt: "desc" },
        include: { session: { select: { id: true, title: true, date: true } } },
      },
      _count: { select: { attendances: true, feedbacks: true } },
    },
  });

  if (!session) {
    notFound();
  }

  const activity = session.activity;
  const isService = activity.type === "SERVICE";

  // Calculate feedback stats for this session only
  const formationFeedbacks = session.feedbacks.filter(
    (f) => f.feedbackType !== "SERVICE" && f.overallRating !== null
  );
  const serviceFeedbacks = session.feedbacks.filter(
    (f) => f.feedbackType === "SERVICE"
  );

  const feedbackStats = isService
    ? serviceFeedbacks.length > 0
      ? {
          avgSatisfaction: (
            serviceFeedbacks.reduce((sum, f) => sum + (f.satisfactionRating || 0), 0) /
            serviceFeedbacks.length
          ).toFixed(1),
          clarityPercent: Math.round(
            (serviceFeedbacks.filter((f) => f.informationClarity).length /
              serviceFeedbacks.length) *
              100
          ),
        }
      : null
    : formationFeedbacks.length > 0
      ? {
          avgOverall: (
            formationFeedbacks.reduce((sum, f) => sum + (f.overallRating || 0), 0) /
            formationFeedbacks.length
          ).toFixed(1),
          avgContent: (
            formationFeedbacks.reduce((sum, f) => sum + (f.contentRating || 0), 0) /
            formationFeedbacks.length
          ).toFixed(1),
          avgOrganization: (
            formationFeedbacks.reduce((sum, f) => sum + (f.organizationRating || 0), 0) /
            formationFeedbacks.length
          ).toFixed(1),
          recommendPercent: Math.round(
            (formationFeedbacks.filter((f) => f.wouldRecommend).length /
              formationFeedbacks.length) *
              100
          ),
        }
      : null;

  const canEdit = userRole === Role.ADMIN || userRole === Role.RESPONSABLE_SERVICE;
  const sessionTitle = session.title || `Séance du ${new Date(session.date).toLocaleDateString("fr-FR")}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/activites/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{sessionTitle}</h1>
            </div>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(session.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {session.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {session.location}
                </span>
              )}
            </div>
            {session.intervenant && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" />
                Intervenant : {session.intervenant.name}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Activité :{" "}
              <Link href={`/activites/${id}`} className="text-primary underline">
                {activity.title}
              </Link>
              {activity.program && (
                <span> — Programme : {activity.program.name}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <KpiStats
        attendancesCount={session._count.attendances}
        feedbacksCount={session._count.feedbacks}
        feedbackStats={feedbackStats}
        isService={isService}
      />

      {/* Tabs */}
      <Tabs defaultValue="presences">
        <TabsList>
          <TabsTrigger value="presences">
            Présences ({session._count.attendances})
          </TabsTrigger>
          <TabsTrigger value="retours">
            Retours ({session._count.feedbacks})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presences">
          <AttendanceTable
            attendances={session.attendances}
            activityId={activity.id}
            canImport={canEdit}
            activityType={activity.type}
          />
        </TabsContent>

        <TabsContent value="retours">
          <FeedbackList
            feedbacks={session.feedbacks}
            stats={feedbackStats}
            activityId={activity.id}
            activityType={activity.type}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
