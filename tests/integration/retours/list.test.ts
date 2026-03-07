import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/retours/[activityId]/route";
import { createRequest, createParams, parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createFormationActivity, createServiceActivity, createTestFeedback } from "../../helpers/seed";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("GET /api/retours/[activityId]", () => {
  it("admin should list feedbacks for FORMATION activity with stats", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    await createTestFeedback(prisma, activity.id, activity.sessions[0].id, "FORMATION", {
      overallRating: 5, contentRating: 4, organizationRating: 3, wouldRecommend: true,
    });
    await createTestFeedback(prisma, activity.id, activity.sessions[0].id, "FORMATION", {
      overallRating: 3, contentRating: 2, organizationRating: 1, wouldRecommend: false,
      participantEmail: "other@test.com",
    });

    const req = createRequest("GET", `/api/retours/${activity.id}`);
    const ctx = createParams({ activityId: activity.id });
    const res = await GET(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.activityType).toBe("FORMATION");
    expect(data.feedbacks).toHaveLength(2);
    expect(data.stats.count).toBe(2);
    expect(data.stats.avgOverall).toBe(4);
    expect(data.stats.avgContent).toBe(3);
    expect(data.stats.avgOrganization).toBe(2);
    expect(data.stats.recommendPercent).toBe(50);
  });

  it("admin should list feedbacks for SERVICE activity with stats", async () => {
    mockAuthUser(users.admin);
    const activity = await createServiceActivity(prisma, users.service.id, users.admin.id, users.program.id);
    await createTestFeedback(prisma, activity.id, activity.sessions[0].id, "SERVICE", {
      satisfactionRating: 5, informationClarity: true,
    });
    await createTestFeedback(prisma, activity.id, activity.sessions[0].id, "SERVICE", {
      satisfactionRating: 3, informationClarity: false, participantEmail: "other@test.com",
    });

    const req = createRequest("GET", `/api/retours/${activity.id}`);
    const ctx = createParams({ activityId: activity.id });
    const res = await GET(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.activityType).toBe("SERVICE");
    expect(data.stats.count).toBe(2);
    expect(data.stats.avgSatisfaction).toBe(4);
    expect(data.stats.clarityPercent).toBe(50);
  });

  it("should filter by sessionId", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    const session2 = await prisma.activitySession.create({
      data: { activityId: activity.id, startDate: new Date(), title: "Séance 2" },
    });

    await createTestFeedback(prisma, activity.id, activity.sessions[0].id, "FORMATION");
    await createTestFeedback(prisma, activity.id, session2.id, "FORMATION", { participantEmail: "s2@test.com" });

    const req = createRequest("GET", `/api/retours/${activity.id}`, {
      searchParams: { sessionId: session2.id },
    });
    const ctx = createParams({ activityId: activity.id });
    const res = await GET(req, ctx);
    const { data } = await parseResponse(res);

    expect(data.feedbacks).toHaveLength(1);
    expect(data.stats.count).toBe(1);
  });

  it("RESPONSABLE should access their service's activity", async () => {
    mockAuthUser(users.responsable);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("GET", `/api/retours/${activity.id}`);
    const ctx = createParams({ activityId: activity.id });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("INTERVENANT should access assigned activity", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      intervenantId: users.intervenant.id,
    });
    mockAuthUser(users.intervenant);

    const req = createRequest("GET", `/api/retours/${activity.id}`);
    const ctx = createParams({ activityId: activity.id });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("should return 403 for PARTICIPANT", async () => {
    mockAuthUser(users.participant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("GET", `/api/retours/${activity.id}`);
    const ctx = createParams({ activityId: activity.id });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("INTERVENANT should get 403 for non-assigned activity", async () => {
    mockAuthUser(users.intervenant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("GET", `/api/retours/${activity.id}`);
    const ctx = createParams({ activityId: activity.id });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 404 for non-existent activity", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/retours/non-existent");
    const ctx = createParams({ activityId: "non-existent" });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("GET", "/api/retours/some-id");
    const ctx = createParams({ activityId: "some-id" });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });

  it("stats should be zero when no feedbacks", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("GET", `/api/retours/${activity.id}`);
    const ctx = createParams({ activityId: activity.id });
    const res = await GET(req, ctx);
    const { data } = await parseResponse(res);

    expect(data.feedbacks).toHaveLength(0);
    expect(data.stats.count).toBe(0);
    expect(data.stats.recommendPercent).toBe(0);
  });
});
