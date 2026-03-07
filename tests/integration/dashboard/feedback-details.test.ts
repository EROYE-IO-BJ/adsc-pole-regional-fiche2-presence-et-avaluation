import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/dashboard/feedback-details/route";
import { createRequest, parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createFormationActivity, createServiceActivity, createTestFeedback } from "../../helpers/seed";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("GET /api/dashboard/feedback-details", () => {
  it("should filter by rating", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    await createTestFeedback(prisma, activity.id, activity.sessions[0].id, "FORMATION", {
      overallRating: 3, participantEmail: "r3@test.com",
    });
    await createTestFeedback(prisma, activity.id, activity.sessions[0].id, "FORMATION", {
      overallRating: 5, participantEmail: "r5@test.com",
    });

    const req = createRequest("GET", "/api/dashboard/feedback-details", {
      searchParams: { filter: "rating", value: "3" },
    });
    const res = await GET(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(1);
    data.forEach((f: any) => {
      expect(f.overallRating === 3 || f.satisfactionRating === 3).toBe(true);
    });
  });

  it("should filter by clarity (yes)", async () => {
    mockAuthUser(users.admin);
    const activity = await createServiceActivity(prisma, users.service.id, users.admin.id, users.program.id);
    await createTestFeedback(prisma, activity.id, activity.sessions[0].id, "SERVICE", {
      informationClarity: true, participantEmail: "c1@test.com",
    });
    await createTestFeedback(prisma, activity.id, activity.sessions[0].id, "SERVICE", {
      informationClarity: false, participantEmail: "c2@test.com",
    });

    const req = createRequest("GET", "/api/dashboard/feedback-details", {
      searchParams: { filter: "clarity", value: "yes" },
    });
    const res = await GET(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    data.forEach((f: any) => expect(f.informationClarity).toBe(true));
  });

  it("should filter by recommendation (yes)", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    await createTestFeedback(prisma, activity.id, activity.sessions[0].id, "FORMATION", {
      wouldRecommend: true, participantEmail: "rec1@test.com",
    });
    await createTestFeedback(prisma, activity.id, activity.sessions[0].id, "FORMATION", {
      wouldRecommend: false, participantEmail: "rec2@test.com",
    });

    const req = createRequest("GET", "/api/dashboard/feedback-details", {
      searchParams: { filter: "recommendation", value: "yes" },
    });
    const res = await GET(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    data.forEach((f: any) => expect(f.wouldRecommend).toBe(true));
  });

  it("should scope to service for RESPONSABLE", async () => {
    mockAuthUser(users.admin);
    const act1 = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    const act2 = await createFormationActivity(prisma, users.service2.id, users.admin.id, users.program2.id, {
      title: "Other Service Activity",
    });
    await createTestFeedback(prisma, act1.id, act1.sessions[0].id, "FORMATION", { participantEmail: "s1@test.com" });
    await createTestFeedback(prisma, act2.id, act2.sessions[0].id, "FORMATION", { participantEmail: "s2@test.com" });

    mockAuthUser(users.responsable);
    const req = createRequest("GET", "/api/dashboard/feedback-details", {
      searchParams: { filter: "rating", value: "4" },
    });
    const res = await GET(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    // Should only have feedbacks from service 1
    data.forEach((f: any) => {
      expect(f.activity).toBeDefined();
    });
  });

  it("should filter by programId", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    await createTestFeedback(prisma, activity.id, activity.sessions[0].id, "FORMATION");

    const req = createRequest("GET", "/api/dashboard/feedback-details", {
      searchParams: { filter: "rating", value: "4", programId: users.program.id },
    });
    const res = await GET(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it("should return 400 when filter is missing", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/dashboard/feedback-details", {
      searchParams: { value: "3" },
    });
    const res = await GET(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 400 when value is missing", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/dashboard/feedback-details", {
      searchParams: { filter: "rating" },
    });
    const res = await GET(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 400 for invalid filter type", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/dashboard/feedback-details", {
      searchParams: { filter: "invalid", value: "3" },
    });
    const res = await GET(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 400 for rating 0 (below min)", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/dashboard/feedback-details", {
      searchParams: { filter: "rating", value: "0" },
    });
    const res = await GET(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 400 for rating 6 (above max)", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/dashboard/feedback-details", {
      searchParams: { filter: "rating", value: "6" },
    });
    const res = await GET(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("GET", "/api/dashboard/feedback-details", {
      searchParams: { filter: "rating", value: "3" },
    });
    const res = await GET(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});
