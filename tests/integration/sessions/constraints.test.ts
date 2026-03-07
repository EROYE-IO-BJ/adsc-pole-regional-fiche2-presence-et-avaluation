import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/sessions/route";
import { GET, PUT, DELETE } from "@/app/api/sessions/[id]/route";
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
    const activity = await createServiceActivity(prisma, users.service.id, users.admin.id, users.program.id);

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
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

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
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    const sessionId = activity.sessions[0].id;

    const req = createRequest("DELETE", `/api/sessions/${sessionId}`);
    const ctx = await createParams({ id: sessionId });

    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });

  it("should allow deleting when more than 1 session exists", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

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

  it("should return 401 for unauthenticated POST", async () => {
    const req = createRequest("POST", "/api/sessions", {
      body: { activityId: "some-id", startDate: "2025-07-01", title: "Test" },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(401);
  });

  it("should return 401 for unauthenticated DELETE", async () => {
    const req = createRequest("DELETE", "/api/sessions/some-id");
    const ctx = await createParams({ id: "some-id" });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);
    expect(status).toBe(401);
  });
});

describe("GET /api/sessions/[id]", () => {
  it("admin should get session detail", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    const sessionId = activity.sessions[0].id;

    const req = createRequest("GET", `/api/sessions/${sessionId}`);
    const ctx = createParams({ id: sessionId });
    const res = await GET(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.activity).toBeDefined();
    expect(data._count).toBeDefined();
  });

  it("should return 404 for non-existent session", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/sessions/non-existent");
    const ctx = createParams({ id: "non-existent" });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("GET", "/api/sessions/some-id");
    const ctx = createParams({ id: "some-id" });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});

describe("PUT /api/sessions/[id]", () => {
  it("admin should update session title and date", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    const sessionId = activity.sessions[0].id;

    const req = createRequest("PUT", `/api/sessions/${sessionId}`, {
      body: { title: "Séance Modifiée", startDate: "2025-07-20" },
    });
    const ctx = createParams({ id: sessionId });
    const res = await PUT(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.title).toBe("Séance Modifiée");
  });

  it("RESPONSABLE should update session in their service", async () => {
    mockAuthUser(users.responsable);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    const sessionId = activity.sessions[0].id;

    const req = createRequest("PUT", `/api/sessions/${sessionId}`, {
      body: { title: "Updated by Resp" },
    });
    const ctx = createParams({ id: sessionId });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("RESPONSABLE should get 403 for session in another service", async () => {
    mockAuthUser(users.responsable);
    const activity = await createFormationActivity(prisma, users.service2.id, users.admin.id, users.program2.id);
    const sessionId = activity.sessions[0].id;

    const req = createRequest("PUT", `/api/sessions/${sessionId}`, {
      body: { title: "Hack" },
    });
    const ctx = createParams({ id: sessionId });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 404 for non-existent session", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("PUT", "/api/sessions/non-existent", {
      body: { title: "Test" },
    });
    const ctx = createParams({ id: "non-existent" });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("PUT", "/api/sessions/some-id", {
      body: { title: "Test" },
    });
    const ctx = createParams({ id: "some-id" });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});
