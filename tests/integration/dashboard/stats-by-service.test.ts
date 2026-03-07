import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/dashboard/stats/by-service/route";
import { parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createFormationActivity } from "../../helpers/seed";
import type { ServiceKPI } from "@/types/dashboard";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("GET /api/dashboard/stats/by-service", () => {
  it("admin should see all services with correct KPIs", async () => {
    mockAuthUser(users.admin);

    // Create activities in both services
    const a1 = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    const a2 = await createFormationActivity(prisma, users.service2.id, users.admin.id, users.program2.id, {
      title: "Formation Service 2",
    });

    // Add attendances and feedbacks
    await prisma.attendance.create({
      data: { firstName: "A", lastName: "B", email: "a@test.com", activityId: a1.id, sessionId: a1.sessions[0].id },
    });
    await prisma.attendance.create({
      data: { firstName: "C", lastName: "D", email: "c@test.com", activityId: a1.id, sessionId: a1.sessions[0].id },
    });
    await prisma.attendance.create({
      data: { firstName: "E", lastName: "F", email: "e@test.com", activityId: a2.id, sessionId: a2.sessions[0].id },
    });

    await prisma.feedback.create({
      data: {
        overallRating: 4,
        wouldRecommend: true,
        activityId: a1.id,
        sessionId: a1.sessions[0].id,
        feedbackType: "FORMATION",
      },
    });
    await prisma.feedback.create({
      data: {
        overallRating: 2,
        wouldRecommend: false,
        activityId: a2.id,
        sessionId: a2.sessions[0].id,
        feedbackType: "FORMATION",
      },
    });

    const res = await GET();
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);

    const kpis = data as ServiceKPI[];
    // Should have 2 services + GLOBAL
    expect(kpis).toHaveLength(3);

    const s1 = kpis.find((k) => k.serviceId === users.service.id);
    expect(s1).toBeDefined();
    expect(s1!.activitiesCount).toBe(1);
    expect(s1!.attendancesCount).toBe(2);
    expect(s1!.feedbacksCount).toBe(1);
    expect(s1!.avgRating).toBe(4);

    const s2 = kpis.find((k) => k.serviceId === users.service2.id);
    expect(s2).toBeDefined();
    expect(s2!.activitiesCount).toBe(1);
    expect(s2!.attendancesCount).toBe(1);
    expect(s2!.feedbacksCount).toBe(1);
    expect(s2!.avgRating).toBe(2);

    const global = kpis.find((k) => k.serviceId === "GLOBAL");
    expect(global).toBeDefined();
    expect(global!.activitiesCount).toBe(2);
    expect(global!.attendancesCount).toBe(3);
    expect(global!.feedbacksCount).toBe(2);
    expect(global!.avgRating).toBe(3);
    expect(global!.recommendationRate).toBe(50);
  });

  it("responsable should see only their services", async () => {
    mockAuthUser(users.admin);

    // Create activities in both services
    await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    await createFormationActivity(prisma, users.service2.id, users.admin.id, users.program2.id, {
      title: "Formation Autre",
    });

    // Switch to responsable (only has access to service)
    mockAuthUser(users.responsable);
    const res = await GET();
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);

    const kpis = data as ServiceKPI[];
    // Should only see service + GLOBAL (not service2)
    const serviceIds = kpis.map((k) => k.serviceId);
    expect(serviceIds).toContain(users.service.id);
    expect(serviceIds).not.toContain(users.service2.id);
    expect(serviceIds).toContain("GLOBAL");
  });

  it("should return only GLOBAL row with zeros on empty DB", async () => {
    mockAuthUser(users.admin);

    const res = await GET();
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);

    const kpis = data as ServiceKPI[];
    // Services exist but have no activities, so they still show up
    const global = kpis.find((k) => k.serviceId === "GLOBAL");
    expect(global).toBeDefined();
    expect(global!.activitiesCount).toBe(0);
    expect(global!.attendancesCount).toBe(0);
    expect(global!.feedbacksCount).toBe(0);
    expect(global!.avgRating).toBeNull();
  });

  it("should return 401 when not authenticated", async () => {
    const res = await GET();
    const { status } = await parseResponse(res);
    expect(status).toBe(401);
  });
});
