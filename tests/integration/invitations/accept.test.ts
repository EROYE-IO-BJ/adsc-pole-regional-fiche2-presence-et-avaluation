import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/invitations/accept/route";
import { createRequest, parseResponse } from "../../helpers/api";
import { createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createTestInvitation } from "../../helpers/seed";
import bcrypt from "bcryptjs";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("GET /api/invitations/accept", () => {
  it("should return invitation info for valid token", async () => {
    const invitation = await createTestInvitation(prisma, users.admin.id, {
      email: "invited@test.com",
      serviceId: users.service.id,
    });

    const req = createRequest("GET", "/api/invitations/accept", {
      searchParams: { token: invitation.token },
    });
    const res = await GET(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.email).toBe("invited@test.com");
    expect(data.role).toBe("INTERVENANT");
    expect(data.expired).toBe(false);
    expect(data.accepted).toBe(false);
  });

  it("should show expired status for expired invitation", async () => {
    const invitation = await createTestInvitation(prisma, users.admin.id, {
      email: "expired@test.com",
      expiresAt: new Date(Date.now() - 1000),
    });

    const req = createRequest("GET", "/api/invitations/accept", {
      searchParams: { token: invitation.token },
    });
    const res = await GET(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.expired).toBe(true);
  });

  it("should show accepted status for accepted invitation", async () => {
    const invitation = await createTestInvitation(prisma, users.admin.id, {
      email: "accepted@test.com",
      acceptedAt: new Date(),
    });

    const req = createRequest("GET", "/api/invitations/accept", {
      searchParams: { token: invitation.token },
    });
    const res = await GET(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.accepted).toBe(true);
  });

  it("should return 400 without token", async () => {
    const req = createRequest("GET", "/api/invitations/accept");
    const res = await GET(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 404 for non-existent token", async () => {
    const req = createRequest("GET", "/api/invitations/accept", {
      searchParams: { token: "non-existent-token" },
    });
    const res = await GET(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });
});

describe("POST /api/invitations/accept", () => {
  it("should create user and mark invitation accepted", async () => {
    const invitation = await createTestInvitation(prisma, users.admin.id, {
      email: "newuser@test.com",
      role: "INTERVENANT",
    });

    const req = createRequest("POST", "/api/invitations/accept", {
      body: {
        token: invitation.token,
        name: "New User",
        password: "password123",
      },
    });
    const res = await POST(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(201);
    expect(data.userId).toBeDefined();

    // Verify user created
    const user = await prisma.user.findUnique({ where: { email: "newuser@test.com" } });
    expect(user).not.toBeNull();
    expect(user!.role).toBe("INTERVENANT");
    expect(user!.emailVerified).not.toBeNull();
  });

  it("should use email from invitation, not from request", async () => {
    const invitation = await createTestInvitation(prisma, users.admin.id, {
      email: "correct@test.com",
    });

    const req = createRequest("POST", "/api/invitations/accept", {
      body: {
        token: invitation.token,
        name: "Test User",
        password: "password123",
      },
    });
    await POST(req);

    const user = await prisma.user.findUnique({ where: { email: "correct@test.com" } });
    expect(user).not.toBeNull();
  });

  it("should create UserService link when serviceId is set", async () => {
    const invitation = await createTestInvitation(prisma, users.admin.id, {
      email: "service-user@test.com",
      serviceId: users.service.id,
    });

    const req = createRequest("POST", "/api/invitations/accept", {
      body: {
        token: invitation.token,
        name: "Service User",
        password: "password123",
      },
    });
    const res = await POST(req);
    const { data } = await parseResponse(res);

    const userService = await prisma.userService.findFirst({
      where: { userId: data.userId },
    });
    expect(userService).not.toBeNull();
    expect(userService!.serviceId).toBe(users.service.id);
  });

  it("password should be hashed with bcrypt", async () => {
    const invitation = await createTestInvitation(prisma, users.admin.id, {
      email: "hash-test@test.com",
    });

    const req = createRequest("POST", "/api/invitations/accept", {
      body: {
        token: invitation.token,
        name: "Hash Test",
        password: "password123",
      },
    });
    await POST(req);

    const user = await prisma.user.findUnique({ where: { email: "hash-test@test.com" } });
    expect(user!.password).not.toBe("password123");
    const isValid = await bcrypt.compare("password123", user!.password!);
    expect(isValid).toBe(true);
  });

  it("should return 400 for already accepted invitation", async () => {
    const invitation = await createTestInvitation(prisma, users.admin.id, {
      email: "already-accepted@test.com",
      acceptedAt: new Date(),
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

  it("should return 400 for expired invitation", async () => {
    const invitation = await createTestInvitation(prisma, users.admin.id, {
      email: "expired-accept@test.com",
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

  it("should return 404 for non-existent token", async () => {
    const req = createRequest("POST", "/api/invitations/accept", {
      body: {
        token: "non-existent",
        name: "Test",
        password: "password123",
      },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 400 for missing fields", async () => {
    const req = createRequest("POST", "/api/invitations/accept", {
      body: {
        token: "some-token",
      },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should mark invitation as accepted with receiverId", async () => {
    const invitation = await createTestInvitation(prisma, users.admin.id, {
      email: "receiver-check@test.com",
    });

    const req = createRequest("POST", "/api/invitations/accept", {
      body: {
        token: invitation.token,
        name: "Receiver Check",
        password: "password123",
      },
    });
    await POST(req);

    const updated = await prisma.invitation.findUnique({ where: { id: invitation.id } });
    expect(updated!.acceptedAt).not.toBeNull();
    expect(updated!.receiverId).not.toBeNull();
  });
});
