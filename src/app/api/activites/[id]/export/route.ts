import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/activites/[id]/export?format=csv
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const serviceId = (session.user as any).serviceId;
  const format = request.nextUrl.searchParams.get("format") || "csv";
  const type = request.nextUrl.searchParams.get("type") || "attendances";

  const activity = await prisma.activity.findFirst({
    where: { id, serviceId },
    include: {
      attendances: { orderBy: { createdAt: "asc" } },
      feedbacks: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!activity) {
    return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
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
