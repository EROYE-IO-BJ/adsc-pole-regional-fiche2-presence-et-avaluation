import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/presences/route";
import { createRequest, parseResponse } from "../../helpers/api";
import { createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createFormationActivity, createServiceActivity } from "../../helpers/seed";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("POST /api/presences", () => {
  it("should submit attendance via activity token (resolves to default session)", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id);

    const req = createRequest("POST", "/api/presences", {
      body: {
        firstName: "Marie",
        lastName: "Diop",
        email: "marie@test.com",
        accessToken: activity.accessToken,
      },
    });

    const res = await POST(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(201);
    expect(data.sessionId).toBe(activity.sessions[0].id);
  });

  it("should submit attendance via session token directly", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id);
    const sessionToken = activity.sessions[0].accessToken;

    const req = createRequest("POST", "/api/presences", {
      body: {
        firstName: "Pierre",
        lastName: "Akpo",
        email: "pierre@test.com",
        accessToken: sessionToken,
      },
    });

    const res = await POST(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(201);
    expect(data.sessionId).toBe(activity.sessions[0].id);
  });

  it("should return 409 for duplicate email+session", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id);

    const body = {
      firstName: "Marie",
      lastName: "Diop",
      email: "marie@test.com",
      accessToken: activity.accessToken,
    };

    // First submission
    await POST(createRequest("POST", "/api/presences", { body }));

    // Duplicate
    const res = await POST(createRequest("POST", "/api/presences", { body }));
    const { status } = await parseResponse(res);
    expect(status).toBe(409);
  });

  it("should return 403 when registration required and user not registered", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, {
      requiresRegistration: true,
    });

    const req = createRequest("POST", "/api/presences", {
      body: {
        firstName: "Unregistered",
        lastName: "User",
        email: "unregistered@test.com",
        accessToken: activity.accessToken,
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(403);
  });

  it("should return 201 when registration required and user IS registered", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, {
      requiresRegistration: true,
    });

    // Register the participant
    await prisma.registration.create({
      data: {
        userId: users.participant.id,
        activityId: activity.id,
      },
    });

    const req = createRequest("POST", "/api/presences", {
      body: {
        firstName: "Participant",
        lastName: "Test",
        email: users.participant.email,
        accessToken: activity.accessToken,
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(201);
  });

  it("should return 400 when activity is CLOSED", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, {
      status: "CLOSED",
    });

    const req = createRequest("POST", "/api/presences", {
      body: {
        firstName: "Marie",
        lastName: "Diop",
        email: "marie@test.com",
        accessToken: activity.accessToken,
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });

  it("should return 404 for invalid token", async () => {
    const req = createRequest("POST", "/api/presences", {
      body: {
        firstName: "Marie",
        lastName: "Diop",
        email: "marie@test.com",
        accessToken: "invalid-token-xyz",
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(404);
  });
});
