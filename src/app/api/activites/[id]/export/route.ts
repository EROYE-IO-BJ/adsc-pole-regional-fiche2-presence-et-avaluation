import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserServiceIds, handleAuthError } from "@/lib/authorization";
import { Role } from "@prisma/client";
import { generateAttendancePdf } from "@/lib/pdf/generate-attendance-pdf";

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
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  const sessionFilter = sessionId ? { sessionId } : {};

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      service: { select: { name: true } },
      program: { select: { name: true } },
      intervenant: { select: { name: true } },
      attendances: {
        where: sessionFilter,
        orderBy: [{ importOrder: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
        include: { session: { select: { title: true, date: true } } },
      },
      feedbacks: {
        where: sessionFilter,
        orderBy: { createdAt: "asc" },
        include: { session: { select: { title: true, date: true } } },
      },
    },
  });

  if (!activity) {
    return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
  }

  // Check access
  let hasAccess = false;
  if (user.role === Role.ADMIN) {
    hasAccess = true;
  } else if (user.role === Role.RESPONSABLE_SERVICE) {
    const serviceIds = await getUserServiceIds(user.id);
    hasAccess = serviceIds.includes(activity.serviceId);
  } else if (user.role === Role.INTERVENANT) {
    hasAccess = activity.intervenantId === user.id;
  }

  if (!hasAccess) {
    return NextResponse.json({ error: "Accès insuffisant" }, { status: 403 });
  }

  if (format === "csv") {
    let csvContent: string;
    let filename: string;

    if (type === "feedbacks") {
      // Check activity type for appropriate headers
      const isService = activity.type === "SERVICE";

      if (isService) {
        const headers = [
          "Nom",
          "Email",
          "Satisfaction",
          "Informations claires",
          "Améliorations",
          "Séance",
          "Date",
        ];
        const rows = activity.feedbacks.map((f) => [
          f.participantName || "",
          f.participantEmail || "",
          f.satisfactionRating ?? "",
          f.informationClarity !== null ? (f.informationClarity ? "Oui" : "Non") : "",
          `"${(f.improvementSuggestion || "").replace(/"/g, '""')}"`,
          f.session?.title || (f.session ? new Date(f.session.date).toLocaleDateString("fr-FR") : ""),
          new Date(f.createdAt).toLocaleDateString("fr-FR"),
        ]);
        csvContent =
          headers.join(",") +
          "\n" +
          rows.map((r) => r.join(",")).join("\n");
      } else {
        const headers = [
          "Nom",
          "Email",
          "Note globale",
          "Note contenu",
          "Note organisation",
          "Recommande",
          "Commentaire",
          "Suggestions",
          "Séance",
          "Date",
        ];
        const rows = activity.feedbacks.map((f) => [
          f.participantName || "",
          f.participantEmail || "",
          f.overallRating ?? "",
          f.contentRating ?? "",
          f.organizationRating ?? "",
          f.wouldRecommend ? "Oui" : "Non",
          `"${(f.comment || "").replace(/"/g, '""')}"`,
          `"${(f.suggestions || "").replace(/"/g, '""')}"`,
          f.session?.title || (f.session ? new Date(f.session.date).toLocaleDateString("fr-FR") : ""),
          new Date(f.createdAt).toLocaleDateString("fr-FR"),
        ]);
        csvContent =
          headers.join(",") +
          "\n" +
          rows.map((r) => r.join(",")).join("\n");
      }
      filename = `feedbacks-${activity.title.replace(/\s+/g, "-")}.csv`;
    } else {
      const headers = [
        "Prénom",
        "Nom",
        "Email",
        "Téléphone",
        "Organisation",
        "Séance",
        "Date",
      ];
      const rows = activity.attendances.map((a) => [
        a.firstName,
        a.lastName,
        a.email,
        a.phone || "",
        a.organization || "",
        a.session?.title || (a.session ? new Date(a.session.date).toLocaleDateString("fr-FR") : ""),
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

  if (format === "pdf") {
    // Find session title if filtering by session
    let sessionTitle: string | null = null;
    if (sessionId) {
      const session = await prisma.activitySession.findUnique({
        where: { id: sessionId },
        select: { title: true, date: true },
      });
      sessionTitle = session?.title || (session ? new Date(session.date).toLocaleDateString("fr-FR") : null);
    }

    const pdfBytes = await generateAttendancePdf(
      {
        title: activity.title,
        date: activity.date,
        location: activity.location,
        serviceName: activity.service.name,
        programName: activity.program?.name || null,
        intervenantName: activity.intervenant?.name || null,
        sessionTitle,
      },
      activity.attendances.map((a) => ({
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        organization: a.organization,
        signature: a.signature,
        sessionTitle: a.session?.title || (a.session ? new Date(a.session.date).toLocaleDateString("fr-FR") : undefined),
        createdAt: a.createdAt,
      }))
    );

    const filename = `presences-${activity.title.replace(/\s+/g, "-")}.pdf`;
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return NextResponse.json({ error: "Format non supporté" }, { status: 400 });
}
