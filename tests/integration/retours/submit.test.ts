import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/retours/route";
import { createRequest, parseResponse } from "../../helpers/api";
import { createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createFormationActivity, createServiceActivity } from "../../helpers/seed";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("POST /api/retours", () => {
  it("should submit FORMATION feedback", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("POST", "/api/retours", {
      body: {
        feedbackType: "FORMATION",
        overallRating: 4,
        contentRating: 5,
        organizationRating: 3,
        comment: "Très bien",
        wouldRecommend: true,
        participantName: "Marie Diop",
        accessToken: activity.accessToken,
      },
    });

    const res = await POST(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(201);
    expect(data.feedbackType).toBe("FORMATION");
    expect(data.overallRating).toBe(4);
    expect(data.contentRating).toBe(5);
    expect(data.sessionId).toBe(activity.sessions[0].id);
  });

  it("should submit SERVICE feedback", async () => {
    const activity = await createServiceActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("POST", "/api/retours", {
      body: {
        feedbackType: "SERVICE",
        satisfactionRating: 4,
        informationClarity: true,
        improvementSuggestion: "Plus de docs",
        accessToken: activity.accessToken,
      },
    });

    const res = await POST(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(201);
    expect(data.feedbackType).toBe("SERVICE");
    expect(data.satisfactionRating).toBe(4);
    expect(data.informationClarity).toBe(true);
  });

  it("should resolve via session token", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    const sessionToken = activity.sessions[0].accessToken;

    const req = createRequest("POST", "/api/retours", {
      body: {
        feedbackType: "FORMATION",
        overallRating: 5,
        contentRating: 5,
        organizationRating: 5,
        accessToken: sessionToken,
      },
    });

    const res = await POST(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(201);
    expect(data.sessionId).toBe(activity.sessions[0].id);
  });

  it("should return 400 when activity is CLOSED", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      status: "CLOSED",
    });

    const req = createRequest("POST", "/api/retours", {
      body: {
        feedbackType: "FORMATION",
        overallRating: 4,
        contentRating: 4,
        organizationRating: 4,
        accessToken: activity.accessToken,
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });

  it("should return 404 for invalid token", async () => {
    const req = createRequest("POST", "/api/retours", {
      body: {
        feedbackType: "FORMATION",
        overallRating: 4,
        contentRating: 4,
        organizationRating: 4,
        accessToken: "invalid-token",
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(404);
  });
});
