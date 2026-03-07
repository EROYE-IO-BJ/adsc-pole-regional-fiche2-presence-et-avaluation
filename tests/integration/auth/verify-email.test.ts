import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/verify-email/route";
import { createRequest, parseResponse } from "../../helpers/api";
import { prisma } from "../../helpers/prisma";

beforeEach(async () => {
  // Create a user for testing
  await prisma.user.create({
    data: {
      name: "Unverified User",
      email: "unverified@test.com",
      password: "hashed",
      role: "PARTICIPANT",
    },
  });
});

describe("POST /api/auth/verify-email", () => {
  it("should verify email with valid token", async () => {
    await prisma.verificationToken.create({
      data: {
        identifier: "unverified@test.com",
        token: "valid-token-123",
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const req = createRequest("POST", "/api/auth/verify-email", {
      body: { token: "valid-token-123" },
    });
    const res = await POST(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.message).toContain("vérifié");

    const user = await prisma.user.findUnique({ where: { email: "unverified@test.com" } });
    expect(user!.emailVerified).not.toBeNull();
  });

  it("should delete token after usage (single-use)", async () => {
    await prisma.verificationToken.create({
      data: {
        identifier: "unverified@test.com",
        token: "single-use-token",
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const req = createRequest("POST", "/api/auth/verify-email", {
      body: { token: "single-use-token" },
    });
    await POST(req);

    const remaining = await prisma.verificationToken.findUnique({
      where: { token: "single-use-token" },
    });
    expect(remaining).toBeNull();
  });

  it("should return 400 for expired token", async () => {
    await prisma.verificationToken.create({
      data: {
        identifier: "unverified@test.com",
        token: "expired-token",
        expires: new Date(Date.now() - 1000),
      },
    });

    const req = createRequest("POST", "/api/auth/verify-email", {
      body: { token: "expired-token" },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 400 for non-existent token", async () => {
    const req = createRequest("POST", "/api/auth/verify-email", {
      body: { token: "non-existent-token" },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 400 for missing token", async () => {
    const req = createRequest("POST", "/api/auth/verify-email", {
      body: {},
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("expired token should be cleaned up", async () => {
    await prisma.verificationToken.create({
      data: {
        identifier: "unverified@test.com",
        token: "cleanup-token",
        expires: new Date(Date.now() - 1000),
      },
    });

    const req = createRequest("POST", "/api/auth/verify-email", {
      body: { token: "cleanup-token" },
    });
    await POST(req);

    const remaining = await prisma.verificationToken.findUnique({
      where: { token: "cleanup-token" },
    });
    expect(remaining).toBeNull();
  });
});
