import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createFeedbackSchema } from "@/lib/validations/feedback";

// POST /api/retours - Public endpoint to submit feedback
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = createFeedbackSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Données invalides", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  // Find the activity by access token
  const activity = await prisma.activity.findUnique({
    where: { accessToken: validation.data.accessToken },
  });

  if (!activity) {
    return NextResponse.json(
      { error: "Activité non trouvée" },
      { status: 404 }
    );
  }

  if (activity.status === "CLOSED") {
    return NextResponse.json(
      { error: "Cette activité est clôturée" },
      { status: 400 }
    );
  }

  const feedback = await prisma.feedback.create({
    data: {
      overallRating: validation.data.overallRating,
      contentRating: validation.data.contentRating,
      organizationRating: validation.data.organizationRating,
      comment: validation.data.comment || null,
      suggestions: validation.data.suggestions || null,
      wouldRecommend: validation.data.wouldRecommend,
      participantName: validation.data.participantName || null,
      participantEmail: validation.data.participantEmail || null,
      activityId: activity.id,
    },
  });

  return NextResponse.json(feedback, { status: 201 });
}
