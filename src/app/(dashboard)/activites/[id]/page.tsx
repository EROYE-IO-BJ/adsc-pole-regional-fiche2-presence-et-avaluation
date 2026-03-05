import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserServiceIds } from "@/lib/authorization";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Share2, CalendarDays, MapPin, Users, MessageSquare, UserCheck, ClipboardList } from "lucide-react";
import Link from "next/link";
import { AttendanceTable } from "@/components/presences/attendance-table";
import { FeedbackList } from "@/components/retours/feedback-list";
import { ActivityActions } from "@/components/activites/activity-actions";
import { SessionList } from "@/components/activites/session-list";
import { Role } from "@prisma/client";

const statusLabels: Record<string, { label: string; variant: "default" | "success" | "warning" | "secondary" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  ACTIVE: { label: "Active", variant: "success" },
  CLOSED: { label: "Clôturée", variant: "warning" },
};

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  // Build query based on role
  let where: any = { id };
  if (userRole === Role.RESPONSABLE_SERVICE && userId) {
    const serviceIds = await getUserServiceIds(userId);
    where.serviceId = { in: serviceIds };
  } else if (userRole === Role.INTERVENANT) {
    where.intervenantId = userId;
  }
  // ADMIN can see all

  const activity = await prisma.activity.findFirst({
    where,
    include: {
      attendances: {
        orderBy: { createdAt: "desc" },
        include: { session: { select: { id: true, title: true, date: true } } },
      },
      feedbacks: {
        orderBy: { createdAt: "desc" },
        include: { session: { select: { id: true, title: true, date: true } } },
      },
      sessions: {
        orderBy: { date: "asc" },
        include: {
          intervenant: { select: { name: true } },
          _count: { select: { attendances: true, feedbacks: true } },
        },
      },
      registrations: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
      createdBy: { select: { name: true } },
      intervenant: { select: { name: true, email: true } },
      service: { select: { name: true } },
      program: { select: { id: true, name: true } },
      _count: { select: { attendances: true, feedbacks: true, registrations: true, sessions: true } },
    },
  });

  if (!activity) {
    notFound();
  }

  const status = statusLabels[activity.status];
  const isFormation = activity.type === "FORMATION";
  const isService = activity.type === "SERVICE";

  // Calculate feedback stats
  const formationFeedbacks = activity.feedbacks.filter(
    (f) => f.feedbackType !== "SERVICE" && f.overallRating !== null
  );
  const serviceFeedbacks = activity.feedbacks.filter(
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/activites">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{activity.title}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant="secondary">{isFormation ? "Formation" : "Service"}</Badge>
              {activity.requiresRegistration && (
                <Badge variant="secondary">Inscription requise</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(activity.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {activity.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {activity.location}
                </span>
              )}
              <span className="text-xs">Service : {activity.service.name}</span>
            </div>
            {activity.intervenant && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" />
                Intervenant : {activity.intervenant.name}
              </p>
            )}
            {activity.program && (
              <p className="text-sm text-muted-foreground mt-1">
                Programme : {activity.program.name}
              </p>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2 ml-14 sm:ml-0">
            <Button variant="outline" asChild>
              <Link href={`/partage/${activity.id}`}>
                <Share2 className="mr-2 h-4 w-4" />
                Partager
              </Link>
            </Button>
            <ActivityActions activityId={activity.id} activityStatus={activity.status} />
          </div>
        )}
      </div>

      {/* Description */}
      {activity.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{activity.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-2">
              <Users className="h-5 w-5 text-[#2980B9]" />
            </div>
            <div className="text-2xl font-bold">{activity._count.attendances}</div>
            <p className="text-xs text-muted-foreground">Présences</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-2">
              <MessageSquare className="h-5 w-5 text-[#D4A017]" />
            </div>
            <div className="text-2xl font-bold">{activity._count.feedbacks}</div>
            <p className="text-xs text-muted-foreground">Feedbacks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">
              {isService
                ? feedbackStats && "avgSatisfaction" in feedbackStats
                  ? `${feedbackStats.avgSatisfaction}/5`
                  : "N/A"
                : feedbackStats && "avgOverall" in feedbackStats
                  ? `${feedbackStats.avgOverall}/5`
                  : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isService ? "Satisfaction" : "Note moyenne"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">
              {isService
                ? feedbackStats && "clarityPercent" in feedbackStats
                  ? `${feedbackStats.clarityPercent}%`
                  : "N/A"
                : feedbackStats && "recommendPercent" in feedbackStats
                  ? `${feedbackStats.recommendPercent}%`
                  : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isService ? "Clarté" : "Recommandent"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="presences">
        <TabsList>
          <TabsTrigger value="presences">
            Présences ({activity._count.attendances})
          </TabsTrigger>
          <TabsTrigger value="retours">
            Retours ({activity._count.feedbacks})
          </TabsTrigger>
          {isFormation && (
            <TabsTrigger value="seances">
              Séances ({activity._count.sessions})
            </TabsTrigger>
          )}
          {activity.requiresRegistration && (
            <TabsTrigger value="inscriptions">
              Inscriptions ({activity._count.registrations})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="presences">
          <AttendanceTable
            attendances={activity.attendances}
            activityId={activity.id}
            canImport={canEdit}
            sessions={activity.sessions}
            activityType={activity.type}
          />
        </TabsContent>

        <TabsContent value="retours">
          <FeedbackList
            feedbacks={activity.feedbacks}
            stats={feedbackStats}
            activityId={activity.id}
            activityType={activity.type}
            sessions={activity.sessions}
          />
        </TabsContent>

        {isFormation && (
          <TabsContent value="seances">
            <SessionList
              sessions={activity.sessions}
              activityId={activity.id}
              canEdit={canEdit}
            />
          </TabsContent>
        )}

        {activity.requiresRegistration && (
          <TabsContent value="inscriptions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardList className="h-5 w-5" />
                  Participants inscrits
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activity.registrations.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucune inscription.</p>
                ) : (
                  <div className="space-y-2">
                    {activity.registrations.map((reg) => (
                      <div
                        key={reg.id}
                        className="flex items-center justify-between border-b pb-2 last:border-0"
                      >
                        <div>
                          <p className="font-medium">{reg.user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {reg.user.email}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(reg.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
