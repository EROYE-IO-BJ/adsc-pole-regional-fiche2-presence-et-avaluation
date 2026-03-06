import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/sessions/route";
import { DELETE } from "@/app/api/sessions/[id]/route";
import { createRequest, createParams, parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createFormationActivity, createServiceActivity } from "../../helpers/seed";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("POST /api/sessions", () => {
  it("should return 400 when adding session to SERVICE activity", async () => {
    mockAuthUser(users.admin);
    const activity = await createServiceActivity(prisma, users.service.id, users.admin.id);

    const req = createRequest("POST", "/api/sessions", {
      body: {
        activityId: activity.id,
        startDate: "2025-07-01",
        title: "Session 2",
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });

  it("should allow adding session to FORMATION activity", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id);

    const req = createRequest("POST", "/api/sessions", {
      body: {
        activityId: activity.id,
        startDate: "2025-07-15",
        title: "Séance 2",
      },
    });

    const res = await POST(req);
    const { status, data } = await parseResponse(res);
    expect(status).toBe(201);
    expect(data.title).toBe("Séance 2");
  });
});

describe("DELETE /api/sessions/[id]", () => {
  it("should return 400 when deleting the last session", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id);
    const sessionId = activity.sessions[0].id;

    const req = createRequest("DELETE", `/api/sessions/${sessionId}`);
    const ctx = await createParams({ id: sessionId });

    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });

  it("should allow deleting when more than 1 session exists", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id);

    // Add second session
    const session2 = await prisma.activitySession.create({
      data: {
        activityId: activity.id,
        startDate: new Date("2025-07-15"),
        title: "Séance 2",
      },
    });

    const req = createRequest("DELETE", `/api/sessions/${session2.id}`);
    const ctx = await createParams({ id: session2.id });

    const res = await DELETE(req, ctx);
    const { status, data } = await parseResponse(res);
    expect(status).toBe(200);
    expect(data.success).toBe(true);
  });
});
