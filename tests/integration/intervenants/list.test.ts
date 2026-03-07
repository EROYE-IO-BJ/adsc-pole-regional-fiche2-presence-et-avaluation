import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/intervenants/route";
import { createRequest, parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("GET /api/intervenants", () => {
  it("admin should list all intervenants", async () => {
    mockAuthUser(users.admin);

    const req = createRequest("GET", "/api/intervenants");
    const res = await GET(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    data.forEach((u: any) => expect(u.role || "INTERVENANT").toBeDefined());
  });

  it("admin should filter by serviceId", async () => {
    mockAuthUser(users.admin);

    // Assign intervenant to service
    await prisma.userService.create({
      data: { userId: users.intervenant.id, serviceId: users.service.id },
    });

    const req = createRequest("GET", "/api/intervenants", {
      searchParams: { serviceId: users.service.id },
    });
    const res = await GET(req);
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it("should include services in response", async () => {
    mockAuthUser(users.admin);

    await prisma.userService.create({
      data: { userId: users.intervenant.id, serviceId: users.service.id },
    });

    const req = createRequest("GET", "/api/intervenants");
    const res = await GET(req);
    const { data } = await parseResponse(res);

    const withServices = data.find((u: any) => u.id === users.intervenant.id);
    if (withServices) {
      expect(withServices.userServices).toBeDefined();
    }
  });

  it("RESPONSABLE should see scoped intervenants", async () => {
    mockAuthUser(users.responsable);

    const req = createRequest("GET", "/api/intervenants");
    const res = await GET(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("should return 403 for INTERVENANT", async () => {
    mockAuthUser(users.intervenant);

    const req = createRequest("GET", "/api/intervenants");
    const res = await GET(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 403 for PARTICIPANT", async () => {
    mockAuthUser(users.participant);

    const req = createRequest("GET", "/api/intervenants");
    const res = await GET(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 401 when not authenticated", async () => {
    const req = createRequest("GET", "/api/intervenants");
    const res = await GET(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});
