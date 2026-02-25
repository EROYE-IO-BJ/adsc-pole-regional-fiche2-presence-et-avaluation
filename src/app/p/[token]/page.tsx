import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClipboardList, MessageSquare } from "lucide-react";

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const activity = await prisma.activity.findUnique({
    where: { accessToken: token },
    select: { id: true, title: true, date: true, location: true, status: true },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Activity info */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
          <p className="text-gray-600">
            {new Date(activity.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          {activity.location && (
            <p className="text-sm text-gray-500">{activity.location}</p>
          )}
        </div>

        {/* Action cards */}
        <div className="space-y-3">
          <Link
            href={`/p/${token}/presence`}
            className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="rounded-full bg-green-100 p-3">
              <ClipboardList className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Feuille de présence</h2>
              <p className="text-sm text-gray-500">Signez votre présence</p>
            </div>
          </Link>

          <Link
            href={`/p/${token}/retour`}
            className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="rounded-full bg-purple-100 p-3">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Donner votre avis</h2>
              <p className="text-sm text-gray-500">Partagez votre feedback</p>
            </div>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400">Sèmè City</p>
      </div>
    </div>
  );
}
