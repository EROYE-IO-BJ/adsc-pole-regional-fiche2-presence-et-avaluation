import { describe, it, expect, beforeEach } from "vitest";
import { GET as listPrograms, POST } from "@/app/api/programs/route";
import { GET as getProgram, PUT, DELETE } from "@/app/api/programs/[id]/route";
import { createRequest, createParams, parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("GET /api/programs", () => {
  it("admin should list all programs with department and counts", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/programs");
    const res = await listPrograms(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(2);
    expect(data[0].department).toBeDefined();
    expect(data[0]._count).toBeDefined();
  });

  it("RESPONSABLE should only see programs for their services", async () => {
    mockAuthUser(users.responsable);

    const req = createRequest("GET", "/api/programs");
    const res = await listPrograms(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    data.forEach((p: any) => expect(p.serviceId).toBe(users.service.id));
  });

  it("admin should filter by serviceId", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/programs", {
      searchParams: { serviceId: users.service.id },
    });
    const res = await listPrograms(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    data.forEach((p: any) => expect(p.serviceId).toBe(users.service.id));
  });

  it("should return 403 for INTERVENANT", async () => {
    mockAuthUser(users.intervenant);

    const req = createRequest("GET", "/api/programs");
    const res = await listPrograms(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 403 for PARTICIPANT", async () => {
    mockAuthUser(users.participant);

    const req = createRequest("GET", "/api/programs");
    const res = await listPrograms(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("GET", "/api/programs");
    const res = await listPrograms(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});

describe("POST /api/programs", () => {
  it("admin should create a program", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("POST", "/api/programs", {
      body: {
        name: "New Program",
        departmentId: users.department.id,
        serviceId: users.service.id,
      },
    });
    const res = await POST(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(201);
    expect(data.name).toBe("New Program");
  });

  it("RESPONSABLE should create for their service", async () => {
    mockAuthUser(users.responsable);

    const req = createRequest("POST", "/api/programs", {
      body: {
        name: "Resp Program",
        departmentId: users.department.id,
        serviceId: users.service.id,
      },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(201);
  });

  it("RESPONSABLE should get 403 for another service", async () => {
    mockAuthUser(users.responsable);

    const req = createRequest("POST", "/api/programs", {
      body: {
        name: "Hack Program",
        departmentId: users.department.id,
        serviceId: users.service2.id,
      },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 400 for missing name", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("POST", "/api/programs", {
      body: {
        departmentId: users.department.id,
      },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it("should return 400 for missing departmentId", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("POST", "/api/programs", {
      body: {
        name: "Program Without Dept",
      },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });
});

describe("GET /api/programs/[id]", () => {
  it("admin should see program detail", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", `/api/programs/${users.program.id}`);
    const ctx = createParams({ id: users.program.id });
    const res = await getProgram(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.department).toBeDefined();
    expect(data.service).toBeDefined();
    expect(data._count).toBeDefined();
  });

  it("RESPONSABLE should access their service's program", async () => {
    mockAuthUser(users.responsable);

    const req = createRequest("GET", `/api/programs/${users.program.id}`);
    const ctx = createParams({ id: users.program.id });
    const res = await getProgram(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("RESPONSABLE should get 404 for another service's program", async () => {
    mockAuthUser(users.responsable);

    const req = createRequest("GET", `/api/programs/${users.program2.id}`);
    const ctx = createParams({ id: users.program2.id });
    const res = await getProgram(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 404 for non-existent program", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/programs/non-existent");
    const ctx = createParams({ id: "non-existent" });
    const res = await getProgram(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });
});

describe("PUT /api/programs/[id]", () => {
  it("admin should update program", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("PUT", `/api/programs/${users.program.id}`, {
      body: { name: "Updated Program" },
    });
    const ctx = createParams({ id: users.program.id });
    const res = await PUT(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.name).toBe("Updated Program");
  });

  it("RESPONSABLE should update program in their service", async () => {
    mockAuthUser(users.responsable);

    const req = createRequest("PUT", `/api/programs/${users.program.id}`, {
      body: { name: "Resp Updated" },
    });
    const ctx = createParams({ id: users.program.id });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("RESPONSABLE should get 404 for another service's program", async () => {
    mockAuthUser(users.responsable);

    const req = createRequest("PUT", `/api/programs/${users.program2.id}`, {
      body: { name: "Hack" },
    });
    const ctx = createParams({ id: users.program2.id });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 404 for non-existent program", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("PUT", "/api/programs/non-existent", {
      body: { name: "Test" },
    });
    const ctx = createParams({ id: "non-existent" });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 400 for invalid data", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("PUT", `/api/programs/${users.program.id}`, {
      body: { name: "A" },
    });
    const ctx = createParams({ id: users.program.id });
    const res = await PUT(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });
});

describe("DELETE /api/programs/[id]", () => {
  it("admin should delete program", async () => {
    mockAuthUser(users.admin);

    const newProg = await prisma.program.create({
      data: { name: "To Delete", departmentId: users.department.id },
    });

    const req = createRequest("DELETE", `/api/programs/${newProg.id}`);
    const ctx = createParams({ id: newProg.id });
    const res = await DELETE(req, ctx);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("RESPONSABLE should delete program in their service", async () => {
    mockAuthUser(users.responsable);

    const newProg = await prisma.program.create({
      data: { name: "To Delete Resp", departmentId: users.department.id, serviceId: users.service.id },
    });

    const req = createRequest("DELETE", `/api/programs/${newProg.id}`);
    const ctx = createParams({ id: newProg.id });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("RESPONSABLE should get 404 for another service's program", async () => {
    mockAuthUser(users.responsable);

    const req = createRequest("DELETE", `/api/programs/${users.program2.id}`);
    const ctx = createParams({ id: users.program2.id });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("should return 404 for non-existent program", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("DELETE", "/api/programs/non-existent");
    const ctx = createParams({ id: "non-existent" });
    const res = await DELETE(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });
});
