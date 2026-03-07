import { describe, it, expect, beforeEach } from "vitest";
import { GET as listUsers } from "@/app/api/users/route";
import { GET as getUser, PUT, DELETE } from "@/app/api/users/[id]/route";
import { createRequest, createParams, parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("GET /api/users", () => {
  it("admin should list all users", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/users");
    const res = await listUsers(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(4);
  });

  it("admin should filter by role", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/users", {
      searchParams: { role: "ADMIN" },
    });
    const res = await listUsers(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    data.forEach((u: any) => expect(u.role).toBe("ADMIN"));
  });

  it("admin should filter by serviceId", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/users", {
      searchParams: { serviceId: users.service.id },
    });
    const res = await listUsers(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    data.forEach((u: any) => expect(u.serviceId).toBe(users.service.id));
  });

  it("admin should search by name", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/users", {
      searchParams: { search: "Admin" },
    });
    const res = await listUsers(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data.some((u: any) => u.name.includes("Admin"))).toBe(true);
  });

  it("admin should search by email", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/users", {
      searchParams: { search: "admin@test" },
    });
    const res = await listUsers(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it("should return 403 for non-admin", async () => {
    mockAuthUser(users.responsable);

    const req = createRequest("GET", "/api/users");
    const res = await listUsers(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("GET", "/api/users");
    const res = await listUsers(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});

describe("GET /api/users/[id]", () => {
  it("admin should see user with services and counts", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", `/api/users/${users.responsable.id}`);
    const ctx = createParams({ id: users.responsable.id });
    const res = await getUser(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.name).toBe("Responsable Test");
    expect(data.userServices).toBeDefined();
    expect(data._count).toBeDefined();
  });

  it("should return 404 for non-existent user", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/users/non-existent");
    const ctx = createParams({ id: "non-existent" });
    const res = await getUser(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("GET", `/api/users/${users.admin.id}`);
    const ctx = createParams({ id: users.admin.id });
    const res = await getUser(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});

describe("PUT /api/users/[id]", () => {
  it("admin should update user name", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("PUT", `/api/users/${users.participant.id}`, {
      body: { name: "New Name" },
    });
    const ctx = createParams({ id: users.participant.id });
    const res = await PUT(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.name).toBe("New Name");
  });

  it("admin should update user role", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("PUT", `/api/users/${users.participant.id}`, {
      body: { role: "INTERVENANT" },
    });
    const ctx = createParams({ id: users.participant.id });
    const res = await PUT(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.role).toBe("INTERVENANT");
  });

  it("admin should update user serviceIds", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("PUT", `/api/users/${users.intervenant.id}`, {
      body: { serviceIds: [users.service.id, users.service2.id] },
    });
    const ctx = createParams({ id: users.intervenant.id });
    const res = await PUT(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.userServices).toHaveLength(2);
  });

  it("should return 400 for invalid email", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("PUT", `/api/users/${users.participant.id}`, {
      body: { email: "not-an-email" },
    });
    const ctx = createParams({ id: users.participant.id });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 404 for non-existent user", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("PUT", "/api/users/non-existent", {
      body: { name: "Test" },
    });
    const ctx = createParams({ id: "non-existent" });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 403 for non-admin", async () => {
    mockAuthUser(users.responsable);

    const req = createRequest("PUT", `/api/users/${users.participant.id}`, {
      body: { name: "Hack" },
    });
    const ctx = createParams({ id: users.participant.id });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("PUT", `/api/users/${users.participant.id}`, {
      body: { name: "Hack" },
    });
    const ctx = createParams({ id: users.participant.id });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});

describe("DELETE /api/users/[id]", () => {
  it("admin should delete user", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("DELETE", `/api/users/${users.participant.id}`);
    const ctx = createParams({ id: users.participant.id });
    const res = await DELETE(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.success).toBe(true);

    const deleted = await prisma.user.findUnique({ where: { id: users.participant.id } });
    expect(deleted).toBeNull();
  });

  it("should return 404 for non-existent user", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("DELETE", "/api/users/non-existent");
    const ctx = createParams({ id: "non-existent" });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 403 for non-admin", async () => {
    mockAuthUser(users.responsable);

    const req = createRequest("DELETE", `/api/users/${users.participant.id}`);
    const ctx = createParams({ id: users.participant.id });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("DELETE", `/api/users/${users.participant.id}`);
    const ctx = createParams({ id: users.participant.id });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});
