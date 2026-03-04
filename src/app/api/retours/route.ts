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

  // Check if this is a session access token
  const sessionRecord = await prisma.activitySession.findUnique({
    where: { accessToken: validation.data.accessToken },
    include: { activity: true },
  });

  let activity;
  let sessionId: string | null = null;

  if (sessionRecord) {
    activity = sessionRecord.activity;
    sessionId = sessionRecord.id;
  } else {
    // Find the activity by access token
    activity = await prisma.activity.findUnique({
      where: { accessToken: validation.data.accessToken },
    });
  }

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

  const data = validation.data;

  if (data.feedbackType === "SERVICE") {
    // SERVICE feedback
    const feedback = await prisma.feedback.create({
      data: {
        feedbackType: "SERVICE",
        satisfactionRating: data.satisfactionRating!,
        informationClarity: data.informationClarity!,
        improvementSuggestion: data.improvementSuggestion || null,
        participantName: data.participantName || null,
        participantEmail: data.participantEmail || null,
        activityId: activity.id,
        sessionId,
      },
    });
    return NextResponse.json(feedback, { status: 201 });
  }

  // FORMATION feedback (default)
  const feedback = await prisma.feedback.create({
    data: {
      feedbackType: "FORMATION",
      overallRating: data.overallRating!,
      contentRating: data.contentRating!,
      organizationRating: data.organizationRating!,
      comment: data.comment || null,
      suggestions: data.suggestions || null,
      wouldRecommend: data.wouldRecommend ?? true,
      participantName: data.participantName || null,
      participantEmail: data.participantEmail || null,
      activityId: activity.id,
      sessionId,
    },
  });

  return NextResponse.json(feedback, { status: 201 });
}
