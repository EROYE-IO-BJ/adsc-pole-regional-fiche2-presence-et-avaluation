import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClipboardList, MessageSquare, CalendarDays, MapPin } from "lucide-react";

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Check if token is for a session
  const sessionRecord = await prisma.activitySession.findUnique({
    where: { accessToken: token },
    include: {
      activity: {
        select: { id: true, title: true, date: true, location: true, status: true, type: true, requiresRegistration: true },
      },
    },
  });

  // Check if token is for an activity
  const activity = sessionRecord
    ? sessionRecord.activity
    : await prisma.activity.findUnique({
        where: { accessToken: token },
        select: { id: true, title: true, date: true, location: true, status: true, type: true, requiresRegistration: true },
      });

  if (!activity) {
    notFound();
  }

  if (activity.status === "CLOSED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Activité clôturée</h1>
          <p className="text-gray-600">
            Cette activité n&apos;accepte plus de soumissions.
          </p>
        </div>
      </div>
    );
  }

  const isFormation = activity.type === "FORMATION";
  const isSession = !!sessionRecord;

  // For FORMATION activities with sessions (not a session token), show session list
  if (isFormation && !isSession) {
    const sessions = await prisma.activitySession.findMany({
      where: { activityId: activity.id },
      orderBy: { date: "asc" },
    });

    if (sessions.length > 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#14355A] to-[#7DD3D0] flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-white">{activity.title}</h1>
              <p className="text-white/80">Choisissez une séance</p>
            </div>

            <div className="space-y-3">
              {sessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/p/${s.accessToken}`}
                  className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="rounded-full bg-[#7DD3D0]/20 p-3">
                    <CalendarDays className="h-6 w-6 text-[#2980B9]" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {s.title || `Séance du ${new Date(s.date).toLocaleDateString("fr-FR")}`}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {new Date(s.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {s.location && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {s.location}
                      </p>
                    )}
                  </div>
                </Link>
              ))}

              {/* Global activity links */}
              <div className="border-t border-white/20 pt-3">
                <Link
                  href={`/p/${token}/retour`}
                  className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="rounded-full bg-[#D4A017]/20 p-3">
                    <MessageSquare className="h-6 w-6 text-[#D4A017]" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Avis global</h2>
                    <p className="text-sm text-gray-500">Évaluer l&apos;activité dans son ensemble</p>
                  </div>
                </Link>
              </div>
            </div>

            <p className="text-center text-xs text-white/50">Sèmè City</p>
          </div>
        </div>
      );
    }
  }

  // Default: show presence + feedback links
  const displayTitle = isSession
    ? `${activity.title} - ${sessionRecord.title || `Séance du ${new Date(sessionRecord.date).toLocaleDateString("fr-FR")}`}`
    : activity.title;

  const displayDate = isSession ? sessionRecord.date : activity.date;
  const displayLocation = isSession ? sessionRecord.location || activity.location : activity.location;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#14355A] to-[#7DD3D0] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Activity info */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">{displayTitle}</h1>
          <p className="text-white/80">
            {new Date(displayDate).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          {displayLocation && (
            <p className="text-sm text-white/60">{displayLocation}</p>
          )}
        </div>

        {/* Action cards */}
        <div className="space-y-3">
          <Link
            href={`/p/${token}/presence`}
            className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="rounded-full bg-[#7DD3D0]/20 p-3">
              <ClipboardList className="h-6 w-6 text-[#2980B9]" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Feuille de présence</h2>
              <p className="text-sm text-gray-500">Signez votre présence</p>
              {activity.requiresRegistration && (
                <p className="text-xs text-amber-600 mt-1">
                  Inscription préalable requise
                </p>
              )}
            </div>
          </Link>

          <Link
            href={`/p/${token}/retour`}
            className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="rounded-full bg-[#D4A017]/20 p-3">
              <MessageSquare className="h-6 w-6 text-[#D4A017]" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Donner votre avis</h2>
              <p className="text-sm text-gray-500">Partagez votre feedback</p>
            </div>
          </Link>
        </div>

        <p className="text-center text-xs text-white/50">Sèmè City</p>
      </div>
    </div>
  );
}
