import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/authorization";
import { Role } from "@prisma/client";

// GET /api/activites/[id]/export?format=csv
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format") || "csv";
  const type = request.nextUrl.searchParams.get("type") || "attendances";

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      attendances: { orderBy: { createdAt: "asc" } },
      feedbacks: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!activity) {
    return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
  }

  // Check access
  const hasAccess =
    user.role === Role.ADMIN ||
    (user.role === Role.RESPONSABLE_SERVICE && activity.serviceId === user.serviceId) ||
    (user.role === Role.INTERVENANT && activity.intervenantId === user.id);

  if (!hasAccess) {
    return NextResponse.json({ error: "Accès insuffisant" }, { status: 403 });
  }

  if (format === "csv") {
    let csvContent: string;
    let filename: string;

    if (type === "feedbacks") {
      const headers = [
        "Nom",
        "Email",
        "Note globale",
        "Note contenu",
        "Note organisation",
        "Recommande",
        "Commentaire",
        "Suggestions",
        "Date",
      ];
      const rows = activity.feedbacks.map((f) => [
        f.participantName || "",
        f.participantEmail || "",
        f.overallRating,
        f.contentRating,
        f.organizationRating,
        f.wouldRecommend ? "Oui" : "Non",
        `"${(f.comment || "").replace(/"/g, '""')}"`,
        `"${(f.suggestions || "").replace(/"/g, '""')}"`,
        new Date(f.createdAt).toLocaleDateString("fr-FR"),
      ]);
      csvContent =
        headers.join(",") +
        "\n" +
        rows.map((r) => r.join(",")).join("\n");
      filename = `feedbacks-${activity.title.replace(/\s+/g, "-")}.csv`;
    } else {
      const headers = [
        "Prénom",
        "Nom",
        "Email",
        "Téléphone",
        "Organisation",
        "Date",
      ];
      const rows = activity.attendances.map((a) => [
        a.firstName,
        a.lastName,
        a.email,
        a.phone || "",
        a.organization || "",
        new Date(a.createdAt).toLocaleDateString("fr-FR"),
      ]);
      csvContent =
        headers.join(",") +
        "\n" +
        rows.map((r) => r.join(",")).join("\n");
      filename = `presences-${activity.title.replace(/\s+/g, "-")}.csv`;
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return NextResponse.json({ error: "Format non supporté" }, { status: 400 });
}
