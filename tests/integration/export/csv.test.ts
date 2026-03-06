import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/activites/[id]/export/route";
import { createRequest, createParams, parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createFormationActivity, createServiceActivity } from "../../helpers/seed";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("GET /api/activites/[id]/export", () => {
  it("should export attendances as CSV with Séance column", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id);

    await prisma.attendance.create({
      data: {
        firstName: "Marie",
        lastName: "Diop",
        email: "marie@test.com",
        activityId: activity.id,
        sessionId: activity.sessions[0].id,
      },
    });

    const req = createRequest("GET", `/api/activites/${activity.id}/export`, {
      searchParams: { type: "attendances", format: "csv" },
    });
    const ctx = await createParams({ id: activity.id });

    const res = await GET(req, ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");

    const csv = await res.text();
    expect(csv).toContain("Séance");
    expect(csv).toContain("Marie");
    expect(csv).toContain("Diop");
  });

  it("should export FORMATION feedbacks with appropriate headers", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id);

    await prisma.feedback.create({
      data: {
        feedbackType: "FORMATION",
        overallRating: 4,
        contentRating: 5,
        organizationRating: 3,
        wouldRecommend: true,
        participantName: "Jean Test",
        activityId: activity.id,
        sessionId: activity.sessions[0].id,
      },
    });

    const req = createRequest("GET", `/api/activites/${activity.id}/export`, {
      searchParams: { type: "feedbacks", format: "csv" },
    });
    const ctx = await createParams({ id: activity.id });

    const res = await GET(req, ctx);
    const csv = await res.text();

    expect(res.status).toBe(200);
    expect(csv).toContain("Note globale");
    expect(csv).toContain("Note contenu");
    expect(csv).toContain("Note organisation");
    expect(csv).toContain("Recommande");
  });

  it("should export SERVICE feedbacks with different headers", async () => {
    mockAuthUser(users.admin);
    const activity = await createServiceActivity(prisma, users.service.id, users.admin.id);

    await prisma.feedback.create({
      data: {
        feedbackType: "SERVICE",
        satisfactionRating: 4,
        informationClarity: true,
        activityId: activity.id,
        sessionId: activity.sessions[0].id,
      },
    });

    const req = createRequest("GET", `/api/activites/${activity.id}/export`, {
      searchParams: { type: "feedbacks", format: "csv" },
    });
    const ctx = await createParams({ id: activity.id });

    const res = await GET(req, ctx);
    const csv = await res.text();

    expect(res.status).toBe(200);
    expect(csv).toContain("Satisfaction");
    expect(csv).toContain("Informations claires");
  });

  it("should filter by sessionId", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id);

    const session2 = await prisma.activitySession.create({
      data: { activityId: activity.id, date: new Date(), title: "Séance 2" },
    });

    await prisma.attendance.createMany({
      data: [
        { firstName: "A", lastName: "B", email: "a@test.com", activityId: activity.id, sessionId: activity.sessions[0].id },
        { firstName: "C", lastName: "D", email: "c@test.com", activityId: activity.id, sessionId: session2.id },
      ],
    });

    const req = createRequest("GET", `/api/activites/${activity.id}/export`, {
      searchParams: { type: "attendances", format: "csv", sessionId: session2.id },
    });
    const ctx = await createParams({ id: activity.id });

    const res = await GET(req, ctx);
    const csv = await res.text();

    expect(csv).toContain("C");
    expect(csv).not.toContain("A,B");
  });

  it("should include Content-Disposition header with activity title", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, {
      title: "Formation IA Avancée",
    });

    const req = createRequest("GET", `/api/activites/${activity.id}/export`, {
      searchParams: { type: "attendances", format: "csv" },
    });
    const ctx = await createParams({ id: activity.id });

    const res = await GET(req, ctx);
    const disposition = res.headers.get("content-disposition") || "";
    expect(disposition).toContain("Formation-IA-Avancée");
  });
});
