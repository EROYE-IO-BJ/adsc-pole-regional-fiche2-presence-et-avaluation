import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/activites/route";
import { createRequest, parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("POST /api/activites", () => {
  it("should create FORMATION with default session (isDefault: true, title 'Séance 1')", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("POST", "/api/activites", {
      body: {
        title: "Formation IA",
        date: "2025-07-01",
        type: "FORMATION",
        serviceId: users.service.id,
      },
    });

    const res = await POST(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(201);
    expect(data.title).toBe("Formation IA");
    expect(data.type).toBe("FORMATION");
    expect(data.sessions).toHaveLength(1);
    expect(data.sessions[0].isDefault).toBe(true);
    expect(data.sessions[0].title).toBe("Séance 1");
  });

  it("should create SERVICE with default session (title null)", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("POST", "/api/activites", {
      body: {
        title: "Accueil public",
        date: "2025-07-01",
        type: "SERVICE",
        serviceId: users.service.id,
      },
    });

    const res = await POST(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(201);
    expect(data.type).toBe("SERVICE");
    expect(data.sessions).toHaveLength(1);
    expect(data.sessions[0].isDefault).toBe(true);
    expect(data.sessions[0].title).toBeNull();
  });

  it("should allow RESPONSABLE_SERVICE to create for their service", async () => {
    mockAuthUser(users.responsable);

    const req = createRequest("POST", "/api/activites", {
      body: {
        title: "Formation RH",
        date: "2025-07-01",
        type: "FORMATION",
        serviceId: users.service.id,
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(201);
  });

  it("should return 403 for RESPONSABLE_SERVICE on another service", async () => {
    mockAuthUser(users.responsable);

    const req = createRequest("POST", "/api/activites", {
      body: {
        title: "Formation Autre",
        date: "2025-07-01",
        type: "FORMATION",
        serviceId: users.service2.id,
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(403);
  });

  it("should return 403 for INTERVENANT", async () => {
    mockAuthUser(users.intervenant);

    const req = createRequest("POST", "/api/activites", {
      body: {
        title: "Test",
        date: "2025-07-01",
        serviceId: users.service.id,
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(403);
  });

  it("should return 403 for PARTICIPANT", async () => {
    mockAuthUser(users.participant);

    const req = createRequest("POST", "/api/activites", {
      body: {
        title: "Test",
        date: "2025-07-01",
        serviceId: users.service.id,
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(403);
  });

  it("should return 400 for missing title", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("POST", "/api/activites", {
      body: {
        date: "2025-07-01",
        serviceId: users.service.id,
      },
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });
});

describe("GET /api/activites", () => {
  it("admin should see all activities", async () => {
    mockAuthUser(users.admin);
    await createActivities();

    const req = createRequest("GET", "/api/activites");
    const res = await GET();
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.length).toBe(2);
  });

  it("responsable should only see their service activities", async () => {
    mockAuthUser(users.responsable);
    await createActivities();

    const res = await GET();
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.length).toBe(1);
    expect(data[0].serviceId).toBe(users.service.id);
  });

  it("should return 401 when not authenticated", async () => {
    // auth mock returns null by default (from setup.ts)
    const res = await GET();
    const { status } = await parseResponse(res);
    expect(status).toBe(401);
  });
});

async function createActivities() {
  await prisma.activity.create({
    data: {
      title: "Activity Service 1",
      date: new Date(),
      serviceId: users.service.id,
      createdById: users.admin.id,
      sessions: { create: { date: new Date(), isDefault: true } },
    },
  });
  await prisma.activity.create({
    data: {
      title: "Activity Service 2",
      date: new Date(),
      serviceId: users.service2.id,
      createdById: users.admin.id,
      sessions: { create: { date: new Date(), isDefault: true } },
    },
  });
}
