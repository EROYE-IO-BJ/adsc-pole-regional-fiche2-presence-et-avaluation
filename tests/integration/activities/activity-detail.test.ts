import { describe, it, expect, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "@/app/api/activites/[id]/route";
import { createRequest, createParams, parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createFormationActivity } from "../../helpers/seed";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("GET /api/activites/[id]", () => {
  it("admin should see activity details", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("GET", `/api/activites/${activity.id}`);
    const ctx = createParams({ id: activity.id });
    const res = await GET(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.title).toBe("Formation Test");
    expect(data._count).toBeDefined();
    expect(data.createdBy).toBeDefined();
    expect(data.service).toBeDefined();
    expect(data.program).toBeDefined();
  });

  it("RESPONSABLE should access activity in their service", async () => {
    mockAuthUser(users.responsable);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("GET", `/api/activites/${activity.id}`);
    const ctx = createParams({ id: activity.id });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("RESPONSABLE should get 404 for activity in another service", async () => {
    mockAuthUser(users.responsable);
    const activity = await createFormationActivity(prisma, users.service2.id, users.admin.id, users.program2.id);

    const req = createRequest("GET", `/api/activites/${activity.id}`);
    const ctx = createParams({ id: activity.id });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("INTERVENANT should access assigned activity", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      intervenantId: users.intervenant.id,
    });
    mockAuthUser(users.intervenant);

    const req = createRequest("GET", `/api/activites/${activity.id}`);
    const ctx = createParams({ id: activity.id });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("INTERVENANT should get 404 for non-assigned activity", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    mockAuthUser(users.intervenant);

    const req = createRequest("GET", `/api/activites/${activity.id}`);
    const ctx = createParams({ id: activity.id });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("PARTICIPANT should access ACTIVE activity", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    mockAuthUser(users.participant);

    const req = createRequest("GET", `/api/activites/${activity.id}`);
    const ctx = createParams({ id: activity.id });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("PARTICIPANT should get 404 for DRAFT activity", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      status: "DRAFT",
    });
    mockAuthUser(users.participant);

    const req = createRequest("GET", `/api/activites/${activity.id}`);
    const ctx = createParams({ id: activity.id });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 404 for non-existent activity", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/activites/non-existent-id");
    const ctx = createParams({ id: "non-existent-id" });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("GET", "/api/activites/some-id");
    const ctx = createParams({ id: "some-id" });
    const res = await GET(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});

describe("PUT /api/activites/[id]", () => {
  it("admin should update activity title", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("PUT", `/api/activites/${activity.id}`, {
      body: { title: "Updated Title", programId: users.program.id },
    });
    const ctx = createParams({ id: activity.id });
    const res = await PUT(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.title).toBe("Updated Title");
  });

  it("admin should update activity status", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("PUT", `/api/activites/${activity.id}`, {
      body: { status: "CLOSED" },
    });
    const ctx = createParams({ id: activity.id });
    const res = await PUT(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.status).toBe("CLOSED");
  });

  it("RESPONSABLE should update activity in their service", async () => {
    mockAuthUser(users.responsable);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("PUT", `/api/activites/${activity.id}`, {
      body: { title: "Updated by Resp" },
    });
    const ctx = createParams({ id: activity.id });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("RESPONSABLE should get 404 for activity in another service", async () => {
    mockAuthUser(users.responsable);
    const activity = await createFormationActivity(prisma, users.service2.id, users.admin.id, users.program2.id);

    const req = createRequest("PUT", `/api/activites/${activity.id}`, {
      body: { title: "Hack" },
    });
    const ctx = createParams({ id: activity.id });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 403 for INTERVENANT", async () => {
    mockAuthUser(users.intervenant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("PUT", `/api/activites/${activity.id}`, {
      body: { title: "Hack" },
    });
    const ctx = createParams({ id: activity.id });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 403 for PARTICIPANT", async () => {
    mockAuthUser(users.participant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("PUT", `/api/activites/${activity.id}`, {
      body: { title: "Hack" },
    });
    const ctx = createParams({ id: activity.id });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 400 for invalid data (title too short)", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("PUT", `/api/activites/${activity.id}`, {
      body: { title: "A" },
    });
    const ctx = createParams({ id: activity.id });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 400 when programId is set to null", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("PUT", `/api/activites/${activity.id}`, {
      body: { programId: null },
    });
    const ctx = createParams({ id: activity.id });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 404 for non-existent activity", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("PUT", "/api/activites/non-existent", {
      body: { title: "Test" },
    });
    const ctx = createParams({ id: "non-existent" });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("PUT", "/api/activites/some-id", {
      body: { title: "Test" },
    });
    const ctx = createParams({ id: "some-id" });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});

describe("DELETE /api/activites/[id]", () => {
  it("admin should delete activity", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("DELETE", `/api/activites/${activity.id}`);
    const ctx = createParams({ id: activity.id });
    const res = await DELETE(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.success).toBe(true);

    const deleted = await prisma.activity.findUnique({ where: { id: activity.id } });
    expect(deleted).toBeNull();
  });

  it("RESPONSABLE should delete activity in their service", async () => {
    mockAuthUser(users.responsable);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("DELETE", `/api/activites/${activity.id}`);
    const ctx = createParams({ id: activity.id });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("RESPONSABLE should get 404 for activity in another service", async () => {
    mockAuthUser(users.responsable);
    const activity = await createFormationActivity(prisma, users.service2.id, users.admin.id, users.program2.id);

    const req = createRequest("DELETE", `/api/activites/${activity.id}`);
    const ctx = createParams({ id: activity.id });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 403 for INTERVENANT", async () => {
    mockAuthUser(users.intervenant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("DELETE", `/api/activites/${activity.id}`);
    const ctx = createParams({ id: activity.id });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 403 for PARTICIPANT", async () => {
    mockAuthUser(users.participant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("DELETE", `/api/activites/${activity.id}`);
    const ctx = createParams({ id: activity.id });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 404 for non-existent activity", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("DELETE", "/api/activites/non-existent");
    const ctx = createParams({ id: "non-existent" });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("DELETE", "/api/activites/some-id");
    const ctx = createParams({ id: "some-id" });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});
