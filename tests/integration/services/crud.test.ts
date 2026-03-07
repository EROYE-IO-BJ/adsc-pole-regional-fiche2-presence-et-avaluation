import { describe, it, expect, beforeEach } from "vitest";
import { GET as listServices, POST } from "@/app/api/services/route";
import { GET as getService, PUT, DELETE } from "@/app/api/services/[id]/route";
import { createRequest, createParams, parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("GET /api/services", () => {
  it("admin should list all services with department and counts", async () => {
    mockAuthUser(users.admin);

    const res = await listServices();
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(2);
    expect(data[0].department).toBeDefined();
    expect(data[0]._count).toBeDefined();
  });

  it("should return 403 for RESPONSABLE", async () => {
    mockAuthUser(users.responsable);

    const res = await listServices();
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 403 for INTERVENANT", async () => {
    mockAuthUser(users.intervenant);

    const res = await listServices();
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 401 when not authenticated", async () => {
    const res = await listServices();
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});

describe("POST /api/services", () => {
  it("admin should create a service", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("POST", "/api/services", {
      body: {
        name: "Nouveau Service",
        slug: "nouveau-service",
        departmentId: users.department.id,
      },
    });
    const res = await POST(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(201);
    expect(data.name).toBe("Nouveau Service");
    expect(data.slug).toBe("nouveau-service");
  });

  it("should return 409 for duplicate name", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("POST", "/api/services", {
      body: {
        name: "Service Test",
        slug: "service-test-dup",
        departmentId: users.department.id,
      },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(409);
  });

  it("should return 409 for duplicate slug", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("POST", "/api/services", {
      body: {
        name: "Service Unique",
        slug: "service-test",
        departmentId: users.department.id,
      },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(409);
  });

  it("should return 400 for invalid data (missing name)", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("POST", "/api/services", {
      body: {
        slug: "valid-slug",
        departmentId: users.department.id,
      },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 400 for invalid slug format", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("POST", "/api/services", {
      body: {
        name: "Test Service",
        slug: "INVALID SLUG!",
        departmentId: users.department.id,
      },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 403 for non-admin", async () => {
    mockAuthUser(users.responsable);

    const req = createRequest("POST", "/api/services", {
      body: {
        name: "Hack Service",
        slug: "hack-service",
        departmentId: users.department.id,
      },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });
});

describe("GET /api/services/[id]", () => {
  it("admin should see service with users and counts", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", `/api/services/${users.service.id}`);
    const ctx = createParams({ id: users.service.id });
    const res = await getService(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.users).toBeDefined();
    expect(data._count).toBeDefined();
  });

  it("should return 404 for non-existent service", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/services/non-existent");
    const ctx = createParams({ id: "non-existent" });
    const res = await getService(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("GET", `/api/services/${users.service.id}`);
    const ctx = createParams({ id: users.service.id });
    const res = await getService(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});

describe("PUT /api/services/[id]", () => {
  it("admin should update service name", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("PUT", `/api/services/${users.service.id}`, {
      body: { name: "Service Renamed" },
    });
    const ctx = createParams({ id: users.service.id });
    const res = await PUT(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.name).toBe("Service Renamed");
  });

  it("should return 400 for invalid data", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("PUT", `/api/services/${users.service.id}`, {
      body: { name: "A" },
    });
    const ctx = createParams({ id: users.service.id });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 404 for non-existent service", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("PUT", "/api/services/non-existent", {
      body: { name: "Test" },
    });
    const ctx = createParams({ id: "non-existent" });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("PUT", `/api/services/${users.service.id}`, {
      body: { name: "Test" },
    });
    const ctx = createParams({ id: users.service.id });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});

describe("DELETE /api/services/[id]", () => {
  it("admin should delete service without dependencies", async () => {
    mockAuthUser(users.admin);

    const newService = await prisma.service.create({
      data: { name: "To Delete", slug: "to-delete", departmentId: users.department.id },
    });

    const req = createRequest("DELETE", `/api/services/${newService.id}`);
    const ctx = createParams({ id: newService.id });
    const res = await DELETE(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should return 400 when service has users", async () => {
    mockAuthUser(users.admin);

    // users.service already has users associated (responsable)
    const req = createRequest("DELETE", `/api/services/${users.service.id}`);
    const ctx = createParams({ id: users.service.id });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 404 for non-existent service", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("DELETE", "/api/services/non-existent");
    const ctx = createParams({ id: "non-existent" });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("DELETE", `/api/services/${users.service.id}`);
    const ctx = createParams({ id: users.service.id });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});
