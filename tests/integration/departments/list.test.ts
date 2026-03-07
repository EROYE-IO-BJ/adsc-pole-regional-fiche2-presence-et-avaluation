import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/departments/route";
import { parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("GET /api/departments", () => {
  it("should list departments with organization for authenticated user", async () => {
    mockAuthUser(users.admin);

    const res = await GET();
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0].organization).toBeDefined();
    expect(data[0].organization.name).toBe("Org Test");
  });

  it("any authenticated role should access departments", async () => {
    mockAuthUser(users.participant);

    const res = await GET();
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("INTERVENANT should access departments", async () => {
    mockAuthUser(users.intervenant);

    const res = await GET();
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("should return 401 when not authenticated", async () => {
    const res = await GET();
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});
