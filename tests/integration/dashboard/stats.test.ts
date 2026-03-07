import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/dashboard/stats/route";
import { createRequest, parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createFormationActivity, createServiceActivity } from "../../helpers/seed";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

function statsRequest(params?: Record<string, string>) {
  return createRequest("GET", "/api/dashboard/stats", { searchParams: params });
}

describe("GET /api/dashboard/stats", () => {
  it("admin should see all stats", async () => {
    mockAuthUser(users.admin);

    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    await prisma.attendance.create({
      data: {
        firstName: "A",
        lastName: "B",
        email: "a@test.com",
        activityId: activity.id,
        sessionId: activity.sessions[0].id,
      },
    });

    const res = await GET(statsRequest());
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.typeDistribution).toBeDefined();
    expect(data.monthlyTrends).toBeDefined();
    expect(data.serviceActivity).toBeDefined();
    expect(data.ratingDistribution).toBeDefined();
    expect(data.clarityRate).toBeDefined();
    expect(data.recommendationRate).toBeDefined();
  });

  it("responsable should see stats scoped to their service", async () => {
    mockAuthUser(users.admin);

    // Create activities in both services
    const a1 = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    const a2 = await createFormationActivity(prisma, users.service2.id, users.admin.id, users.program2.id, {
      title: "Formation Autre Service",
    });

    await prisma.attendance.create({
      data: { firstName: "A", lastName: "B", email: "a@test.com", activityId: a1.id, sessionId: a1.sessions[0].id },
    });
    await prisma.attendance.create({
      data: { firstName: "C", lastName: "D", email: "c@test.com", activityId: a2.id, sessionId: a2.sessions[0].id },
    });

    // Now switch to responsable
    mockAuthUser(users.responsable);
    const res = await GET(statsRequest());
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    // Responsable should only see data from their service
    const formationCount = data.typeDistribution.find(
      (t: { type: string; count: number }) => t.type === "FORMATION"
    );
    expect(formationCount?.count).toBe(1);
  });

  it("should return default values on empty DB without errors", async () => {
    mockAuthUser(users.admin);

    const res = await GET(statsRequest());
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.monthlyTrends).toEqual([]);
    expect(data.typeDistribution).toEqual([
      { type: "FORMATION", count: 0 },
      { type: "SERVICE", count: 0 },
    ]);
    expect(data.ratingDistribution).toHaveLength(5);
    expect(data.clarityRate).toEqual({ yes: 0, no: 0, total: 0 });
    expect(data.recommendationRate).toEqual({ yes: 0, no: 0, total: 0 });
  });

  it("should return 401 when not authenticated", async () => {
    // auth mock returns null by default
    const res = await GET(statsRequest());
    const { status } = await parseResponse(res);
    expect(status).toBe(401);
  });

  describe("serviceId filter", () => {
    it("admin with serviceId should get stats filtered for that service only", async () => {
      mockAuthUser(users.admin);

      const a1 = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
      const a2 = await createFormationActivity(prisma, users.service2.id, users.admin.id, users.program2.id, {
        title: "Formation Autre",
      });

      await prisma.attendance.create({
        data: { firstName: "A", lastName: "B", email: "a@test.com", activityId: a1.id, sessionId: a1.sessions[0].id },
      });
      await prisma.attendance.create({
        data: { firstName: "C", lastName: "D", email: "c@test.com", activityId: a2.id, sessionId: a2.sessions[0].id },
      });

      // Filter by service 1
      const res = await GET(statsRequest({ serviceId: users.service.id }));
      const { status, data } = await parseResponse(res);

      expect(status).toBe(200);
      const formationCount = data.typeDistribution.find(
        (t: { type: string; count: number }) => t.type === "FORMATION"
      );
      expect(formationCount?.count).toBe(1);
    });

    it("responsable with valid serviceId should get filtered stats", async () => {
      mockAuthUser(users.admin);
      await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

      mockAuthUser(users.responsable);
      const res = await GET(statsRequest({ serviceId: users.service.id }));
      const { status, data } = await parseResponse(res);

      expect(status).toBe(200);
      expect(data.typeDistribution).toBeDefined();
    });

    it("responsable with unauthorized serviceId should get 403", async () => {
      mockAuthUser(users.responsable);
      const res = await GET(statsRequest({ serviceId: users.service2.id }));
      const { status } = await parseResponse(res);

      expect(status).toBe(403);
    });
  });
});
