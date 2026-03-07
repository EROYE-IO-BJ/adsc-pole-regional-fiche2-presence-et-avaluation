import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/activites/by-token/route";
import { createRequest, parseResponse } from "../../helpers/api";
import { createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createFormationActivity, createServiceActivity } from "../../helpers/seed";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("GET /api/activites/by-token", () => {
  it("should return activity type and sessions via activity token", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("GET", "/api/activites/by-token", {
      searchParams: { token: activity.accessToken },
    });
    const res = await GET(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.type).toBe("FORMATION");
    expect(data.sessions).toHaveLength(1);
    expect(data.sessionId).toBeUndefined();
  });

  it("should return sessionId when using session token", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    const sessionToken = activity.sessions[0].accessToken;

    const req = createRequest("GET", "/api/activites/by-token", {
      searchParams: { token: sessionToken },
    });
    const res = await GET(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.type).toBe("FORMATION");
    expect(data.sessionId).toBe(activity.sessions[0].id);
    expect(data.sessions).toHaveLength(1);
  });

  it("should return SERVICE type for service activity token", async () => {
    const activity = await createServiceActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("GET", "/api/activites/by-token", {
      searchParams: { token: activity.accessToken },
    });
    const res = await GET(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.type).toBe("SERVICE");
  });

  it("should return 400 without token parameter", async () => {
    const req = createRequest("GET", "/api/activites/by-token");
    const res = await GET(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 404 for invalid token", async () => {
    const req = createRequest("GET", "/api/activites/by-token", {
      searchParams: { token: "invalid-token-xyz" },
    });
    const res = await GET(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should not expose sensitive fields in sessions", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("GET", "/api/activites/by-token", {
      searchParams: { token: activity.accessToken },
    });
    const res = await GET(req);
    const { data } = await parseResponse(res);

    const session = data.sessions[0];
    expect(session.id).toBeDefined();
    expect(session.accessToken).toBeDefined();
    expect(session.title).toBeDefined();
  });

  it("should handle very long token string gracefully", async () => {
    const longToken = "a".repeat(10000);
    const req = createRequest("GET", "/api/activites/by-token", {
      searchParams: { token: longToken },
    });
    const res = await GET(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });
});
