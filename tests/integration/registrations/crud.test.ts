import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/registrations/route";
import { DELETE } from "@/app/api/registrations/[id]/route";
import { createRequest, createParams, parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createFormationActivity } from "../../helpers/seed";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("GET /api/registrations", () => {
  it("PARTICIPANT should list their registrations with activity details", async () => {
    mockAuthUser(users.participant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      requiresRegistration: true,
    });

    await prisma.registration.create({
      data: { userId: users.participant.id, activityId: activity.id },
    });

    const res = await GET();
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].activity).toBeDefined();
    expect(data[0].activity.title).toBe("Formation Test");
  });

  it("should return empty array when no registrations", async () => {
    mockAuthUser(users.participant);

    const res = await GET();
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data).toHaveLength(0);
  });

  it("should return 403 for ADMIN", async () => {
    mockAuthUser(users.admin);

    const res = await GET();
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 401 when not authenticated", async () => {
    const res = await GET();
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});

describe("POST /api/registrations", () => {
  it("PARTICIPANT should register for activity requiring registration", async () => {
    mockAuthUser(users.participant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      requiresRegistration: true,
    });

    const req = createRequest("POST", "/api/registrations", {
      body: { activityId: activity.id },
    });
    const res = await POST(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(201);
    expect(data.userId).toBe(users.participant.id);
    expect(data.activityId).toBe(activity.id);
  });

  it("should return 400 when activity does not require registration", async () => {
    mockAuthUser(users.participant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      requiresRegistration: false,
    });

    const req = createRequest("POST", "/api/registrations", {
      body: { activityId: activity.id },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 400 when activity is CLOSED", async () => {
    mockAuthUser(users.participant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      requiresRegistration: true,
      status: "CLOSED",
    });

    const req = createRequest("POST", "/api/registrations", {
      body: { activityId: activity.id },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 400 when activity is DRAFT", async () => {
    mockAuthUser(users.participant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      requiresRegistration: true,
      status: "DRAFT",
    });

    const req = createRequest("POST", "/api/registrations", {
      body: { activityId: activity.id },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 409 for duplicate registration", async () => {
    mockAuthUser(users.participant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      requiresRegistration: true,
    });

    await prisma.registration.create({
      data: { userId: users.participant.id, activityId: activity.id },
    });

    const req = createRequest("POST", "/api/registrations", {
      body: { activityId: activity.id },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(409);
  });

  it("should return 404 for non-existent activity", async () => {
    mockAuthUser(users.participant);

    const req = createRequest("POST", "/api/registrations", {
      body: { activityId: "non-existent-id" },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 403 for non-PARTICIPANT", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("POST", "/api/registrations", {
      body: { activityId: "some-id" },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });
});

describe("DELETE /api/registrations/[id]", () => {
  it("PARTICIPANT should cancel their own registration", async () => {
    mockAuthUser(users.participant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      requiresRegistration: true,
    });

    const reg = await prisma.registration.create({
      data: { userId: users.participant.id, activityId: activity.id },
    });

    const req = createRequest("DELETE", `/api/registrations/${reg.id}`);
    const ctx = createParams({ id: reg.id });
    const res = await DELETE(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should return 404 when canceling another user's registration (IDOR protection)", async () => {
    // Create another participant
    const otherParticipant = await prisma.user.create({
      data: {
        name: "Other Participant",
        email: "other-participant@test.com",
        password: "hashed",
        role: "PARTICIPANT",
      },
    });

    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      requiresRegistration: true,
    });

    const otherReg = await prisma.registration.create({
      data: { userId: otherParticipant.id, activityId: activity.id },
    });

    // Try to cancel as our participant
    mockAuthUser(users.participant);
    const req = createRequest("DELETE", `/api/registrations/${otherReg.id}`);
    const ctx = createParams({ id: otherReg.id });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 404 for non-existent registration", async () => {
    mockAuthUser(users.participant);

    const req = createRequest("DELETE", "/api/registrations/non-existent");
    const ctx = createParams({ id: "non-existent" });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("DELETE", "/api/registrations/some-id");
    const ctx = createParams({ id: "some-id" });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});
