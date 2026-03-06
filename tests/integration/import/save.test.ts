import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/import/save/route";
import { createRequest, parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createFormationActivity } from "../../helpers/seed";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("POST /api/import/save", () => {
  it("should import participants and return created/duplicates counts", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id);

    const req = createRequest("POST", "/api/import/save", {
      body: {
        activityId: activity.id,
        participants: [
          { firstName: "Alice", lastName: "Doe", email: "alice@test.com" },
          { firstName: "Bob", lastName: "Smith", email: "bob@test.com" },
        ],
      },
    });

    const res = await POST(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.created).toBe(2);
    expect(data.duplicates).toBe(0);
  });

  it("should use provided sessionId", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id);

    // Add a second session
    const session2 = await prisma.activitySession.create({
      data: { activityId: activity.id, date: new Date(), title: "Séance 2" },
    });

    const req = createRequest("POST", "/api/import/save", {
      body: {
        activityId: activity.id,
        sessionId: session2.id,
        participants: [
          { firstName: "Alice", lastName: "Doe", email: "alice@test.com" },
        ],
      },
    });

    const res = await POST(req);
    const { status, data } = await parseResponse(res);
    expect(status).toBe(200);
    expect(data.created).toBe(1);

    const attendance = await prisma.attendance.findFirst({ where: { email: "alice@test.com" } });
    expect(attendance!.sessionId).toBe(session2.id);
  });

  it("should fallback to default session when no sessionId provided", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id);

    const req = createRequest("POST", "/api/import/save", {
      body: {
        activityId: activity.id,
        participants: [
          { firstName: "Alice", lastName: "Doe", email: "alice@test.com" },
        ],
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(200);

    const attendance = await prisma.attendance.findFirst({ where: { email: "alice@test.com" } });
    expect(attendance!.sessionId).toBe(activity.sessions[0].id);
  });

  it("should return 400 for session not belonging to activity", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id);
    const otherActivity = await createFormationActivity(prisma, users.service.id, users.admin.id, {
      title: "Other Formation",
    });

    const req = createRequest("POST", "/api/import/save", {
      body: {
        activityId: activity.id,
        sessionId: otherActivity.sessions[0].id,
        participants: [
          { firstName: "Alice", lastName: "Doe", email: "alice@test.com" },
        ],
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });

  it("should skip duplicates", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id);

    // Create first attendance
    await prisma.attendance.create({
      data: {
        firstName: "Alice",
        lastName: "Doe",
        email: "alice@test.com",
        activityId: activity.id,
        sessionId: activity.sessions[0].id,
      },
    });

    const req = createRequest("POST", "/api/import/save", {
      body: {
        activityId: activity.id,
        participants: [
          { firstName: "Alice", lastName: "Doe", email: "alice@test.com" },
          { firstName: "Bob", lastName: "Smith", email: "bob@test.com" },
        ],
      },
    });

    const res = await POST(req);
    const { status, data } = await parseResponse(res);
    expect(status).toBe(200);
    expect(data.created).toBe(1);
    expect(data.duplicates).toBe(1);
  });

  it("should return 401 when not authenticated", async () => {
    // auth mock returns null by default
    const req = createRequest("POST", "/api/import/save", {
      body: {
        activityId: "some-id",
        participants: [{ firstName: "A", lastName: "B", email: "a@b.com" }],
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(401);
  });
});
