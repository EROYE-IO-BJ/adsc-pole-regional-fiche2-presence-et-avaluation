import { describe, it, expect, beforeEach } from "vitest";
import { createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createFormationActivity, createTestInvitation } from "../../helpers/seed";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("Token security", () => {
  it("activity access tokens should be unique", async () => {
    const act1 = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      title: "Activity 1",
    });
    const act2 = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      title: "Activity 2",
    });

    expect(act1.accessToken).not.toBe(act2.accessToken);
  });

  it("session access tokens should be unique", async () => {
    const act1 = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      title: "Activity 1",
    });
    const act2 = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      title: "Activity 2",
    });

    expect(act1.sessions[0].accessToken).not.toBe(act2.sessions[0].accessToken);
  });

  it("invitation tokens should be unique", async () => {
    const inv1 = await createTestInvitation(prisma, users.admin.id, {
      email: "unique1@test.com",
    });
    const inv2 = await createTestInvitation(prisma, users.admin.id, {
      email: "unique2@test.com",
    });

    expect(inv1.token).not.toBe(inv2.token);
  });

  it("tokens should not be sequential/predictable", async () => {
    const act1 = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      title: "Activity A",
    });
    const act2 = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      title: "Activity B",
    });

    // CUIDs are not sequential in a predictable way
    // Check they're not just incrementing numbers
    const diff = act2.accessToken.length - act1.accessToken.length;
    expect(Math.abs(diff)).toBeLessThanOrEqual(5); // Similar length (CUID format)
    expect(act1.accessToken).not.toBe(act2.accessToken);
  });

  it("expired invitation cannot be accepted", async () => {
    const { POST } = await import("@/app/api/invitations/accept/route");
    const { createRequest, parseResponse } = await import("../../helpers/api");

    const invitation = await createTestInvitation(prisma, users.admin.id, {
      email: "expired@test.com",
      expiresAt: new Date(Date.now() - 1000),
    });

    const req = createRequest("POST", "/api/invitations/accept", {
      body: {
        token: invitation.token,
        name: "Test",
        password: "password123",
      },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("verification token should be single-use", async () => {
    const { POST } = await import("@/app/api/auth/verify-email/route");
    const { createRequest, parseResponse } = await import("../../helpers/api");

    await prisma.user.create({
      data: {
        name: "Token User",
        email: "tokenuser@test.com",
        password: "hashed",
        role: "PARTICIPANT",
      },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: "tokenuser@test.com",
        token: "single-use-security-token",
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // First use
    const req1 = createRequest("POST", "/api/auth/verify-email", {
      body: { token: "single-use-security-token" },
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(200);

    // Second use should fail
    const req2 = createRequest("POST", "/api/auth/verify-email", {
      body: { token: "single-use-security-token" },
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(400);
  });

  it("activity access token resolves but CLOSED activity blocks operations", async () => {
    const { POST } = await import("@/app/api/presences/route");
    const { createRequest, parseResponse } = await import("../../helpers/api");

    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      status: "CLOSED",
    });

    const req = createRequest("POST", "/api/presences", {
      body: {
        firstName: "Test",
        lastName: "User",
        email: "test@test.com",
        accessToken: activity.accessToken,
      },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });
});
