import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/presences/[activityId]/route";
import { createRequest, createParams, parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createFormationActivity, createTestAttendance } from "../../helpers/seed";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("GET /api/presences/[activityId]", () => {
  it("admin should list attendances", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    await createTestAttendance(prisma, activity.id, activity.sessions[0].id);

    const req = createRequest("GET", `/api/presences/${activity.id}`);
    const ctx = createParams({ activityId: activity.id });
    const res = await GET(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].session).toBeDefined();
  });

  it("should include session info in attendances", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    await createTestAttendance(prisma, activity.id, activity.sessions[0].id);

    const req = createRequest("GET", `/api/presences/${activity.id}`);
    const ctx = createParams({ activityId: activity.id });
    const res = await GET(req, ctx);
    const { data } = await parseResponse(res);

    expect(data[0].session.id).toBe(activity.sessions[0].id);
  });

  it("should filter by sessionId", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    const session2 = await prisma.activitySession.create({
      data: { activityId: activity.id, startDate: new Date(), title: "Séance 2" },
    });

    await createTestAttendance(prisma, activity.id, activity.sessions[0].id, { email: "a@test.com" });
    await createTestAttendance(prisma, activity.id, session2.id, { email: "b@test.com" });

    const req = createRequest("GET", `/api/presences/${activity.id}`, {
      searchParams: { sessionId: session2.id },
    });
    const ctx = createParams({ activityId: activity.id });
    const res = await GET(req, ctx);
    const { data } = await parseResponse(res);

    expect(data).toHaveLength(1);
    expect(data[0].email).toBe("b@test.com");
  });

  it("RESPONSABLE should access their service's activity attendances", async () => {
    mockAuthUser(users.responsable);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("GET", `/api/presences/${activity.id}`);
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

    const req = createRequest("GET", `/api/presences/${activity.id}`);
    const ctx = createParams({ activityId: activity.id });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("should return 403 for PARTICIPANT", async () => {
    mockAuthUser(users.participant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("GET", `/api/presences/${activity.id}`);
    const ctx = createParams({ activityId: activity.id });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("INTERVENANT should get 403 for non-assigned activity", async () => {
    mockAuthUser(users.intervenant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("GET", `/api/presences/${activity.id}`);
    const ctx = createParams({ activityId: activity.id });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 404 for non-existent activity", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/presences/non-existent");
    const ctx = createParams({ activityId: "non-existent" });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("GET", "/api/presences/some-id");
    const ctx = createParams({ activityId: "some-id" });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });

  it("should order by importOrder then createdAt", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    await createTestAttendance(prisma, activity.id, activity.sessions[0].id, {
      email: "z@test.com", importOrder: 2,
    });
    await createTestAttendance(prisma, activity.id, activity.sessions[0].id, {
      email: "a@test.com", importOrder: 1,
    });

    const req = createRequest("GET", `/api/presences/${activity.id}`);
    const ctx = createParams({ activityId: activity.id });
    const res = await GET(req, ctx);
    const { data } = await parseResponse(res);

    expect(data[0].email).toBe("a@test.com");
    expect(data[1].email).toBe("z@test.com");
  });
});
