import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/dashboard/filter-users/route";
import { parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("GET /api/dashboard/filter-users", () => {
  it("admin should see ADMIN, RESPONSABLE, INTERVENANT (not PARTICIPANT)", async () => {
    mockAuthUser(users.admin);

    const res = await GET();
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    const roles = data.map((u: any) => u.role);
    expect(roles).not.toContain("PARTICIPANT");
    expect(roles).toContain("ADMIN");
    expect(roles).toContain("RESPONSABLE_SERVICE");
    expect(roles).toContain("INTERVENANT");
  });

  it("users should be sorted by name", async () => {
    mockAuthUser(users.admin);

    const res = await GET();
    const { data } = await parseResponse(res);

    const names = data.map((u: any) => u.name);
    const sorted = [...names].sort((a: string, b: string) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it("RESPONSABLE should see scoped users", async () => {
    mockAuthUser(users.responsable);

    const res = await GET();
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it("should return 401 when not authenticated", async () => {
    const res = await GET();
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});
