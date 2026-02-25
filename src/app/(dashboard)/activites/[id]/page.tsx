import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Share2, CalendarDays, MapPin, Users, MessageSquare } from "lucide-react";
import Link from "next/link";
import { AttendanceTable } from "@/components/presences/attendance-table";
import { FeedbackList } from "@/components/retours/feedback-list";
import { ActivityActions } from "@/components/activites/activity-actions";

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
  const serviceId = (session?.user as any)?.serviceId;

  const activity = await prisma.activity.findFirst({
    where: { id, serviceId },
    include: {
      attendances: { orderBy: { createdAt: "desc" } },
      feedbacks: { orderBy: { createdAt: "desc" } },
      createdBy: { select: { name: true } },
      _count: { select: { attendances: true, feedbacks: true } },
    },
  });

  if (!activity) {
    notFound();
  }

  const status = statusLabels[activity.status];

  // Calculate feedback stats
  const feedbackStats = activity.feedbacks.length > 0
    ? {
        avgOverall: (
          activity.feedbacks.reduce((sum, f) => sum + f.overallRating, 0) /
          activity.feedbacks.length
        ).toFixed(1),
        avgContent: (
          activity.feedbacks.reduce((sum, f) => sum + f.contentRating, 0) /
          activity.feedbacks.length
        ).toFixed(1),
        avgOrganization: (
          activity.feedbacks.reduce((sum, f) => sum + f.organizationRating, 0) /
          activity.feedbacks.length
        ).toFixed(1),
        recommendPercent: Math.round(
          (activity.feedbacks.filter((f) => f.wouldRecommend).length /
            activity.feedbacks.length) *
            100
        ),
      }
    : null;

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
            </div>
          </div>
        </div>
        <div className="flex gap-2 ml-14 sm:ml-0">
          <Button variant="outline" asChild>
            <Link href={`/partage/${activity.id}`}>
              <Share2 className="mr-2 h-4 w-4" />
              Partager
            </Link>
          </Button>
          <ActivityActions activityId={activity.id} activityStatus={activity.status} />
        </div>
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
              {feedbackStats ? `${feedbackStats.avgOverall}/5` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Note moyenne</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">
              {feedbackStats ? `${feedbackStats.recommendPercent}%` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Recommandent</p>
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
        </TabsList>

        <TabsContent value="presences">
          <AttendanceTable
            attendances={activity.attendances}
            activityId={activity.id}
          />
        </TabsContent>

        <TabsContent value="retours">
          <FeedbackList
            feedbacks={activity.feedbacks}
            stats={feedbackStats}
            activityId={activity.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
