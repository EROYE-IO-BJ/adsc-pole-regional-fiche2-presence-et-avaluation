import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/auth/register/route";
import { createRequest, parseResponse } from "../../helpers/api";
import { prisma } from "../../helpers/prisma";

describe("POST /api/auth/register", () => {
  it("should register a new user as PARTICIPANT with email verified", async () => {
    const req = createRequest("POST", "/api/auth/register", {
      body: {
        name: "Jean Dupont",
        email: "jean@test.com",
        password: "password123",
        confirmPassword: "password123",
      },
    });

    const res = await POST(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(201);
    expect(data.userId).toBeDefined();

    const user = await prisma.user.findUnique({ where: { email: "jean@test.com" } });
    expect(user).not.toBeNull();
    expect(user!.role).toBe("PARTICIPANT");
    expect(user!.emailVerified).not.toBeNull();
  });

  it("should return 409 for duplicate email", async () => {
    await prisma.user.create({
      data: {
        name: "Existing",
        email: "existing@test.com",
        password: "hashed",
        role: "PARTICIPANT",
      },
    });

    const req = createRequest("POST", "/api/auth/register", {
      body: {
        name: "Another User",
        email: "existing@test.com",
        password: "password123",
        confirmPassword: "password123",
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(409);
  });

  it("should return 400 for short password", async () => {
    const req = createRequest("POST", "/api/auth/register", {
      body: {
        name: "Jean Dupont",
        email: "jean@test.com",
        password: "abc",
        confirmPassword: "abc",
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });

  it("should return 400 for non-matching passwords", async () => {
    const req = createRequest("POST", "/api/auth/register", {
      body: {
        name: "Jean Dupont",
        email: "jean@test.com",
        password: "password123",
        confirmPassword: "different456",
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });
});
