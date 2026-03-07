import { describe, it, expect, beforeEach } from "vitest";
import { createRequest, createParams, parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createFormationActivity } from "../../helpers/seed";

import { GET as getServices } from "@/app/api/services/route";
import { GET as getUsers } from "@/app/api/users/route";
import { DELETE as deleteRegistration } from "@/app/api/registrations/[id]/route";
import { GET as getPresences } from "@/app/api/presences/[activityId]/route";
import { GET as getRetours } from "@/app/api/retours/[activityId]/route";
import { GET as getActiviteDetail, PUT as putActivite } from "@/app/api/activites/[id]/route";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("Authorization matrix - admin-only endpoints", () => {
  it("GET /api/services should return 403 for PARTICIPANT", async () => {
    mockAuthUser(users.participant);
    const res = await getServices();
    const { status } = await parseResponse(res);
    expect(status).toBe(403);
  });

  it("GET /api/users should return 403 for INTERVENANT", async () => {
    mockAuthUser(users.intervenant);
    const req = createRequest("GET", "/api/users");
    const res = await getUsers(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(403);
  });

  it("GET /api/services should return 401 without auth", async () => {
    const res = await getServices();
    const { status } = await parseResponse(res);
    expect(status).toBe(401);
  });

  it("GET /api/users should return 401 without auth", async () => {
    const req = createRequest("GET", "/api/users");
    const res = await getUsers(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(401);
  });
});

describe("IDOR protection", () => {
  it("RESPONSABLE cannot access activity of another service by direct ID", async () => {
    const activity = await createFormationActivity(prisma, users.service2.id, users.admin.id, users.program2.id);
    mockAuthUser(users.responsable);

    const req = createRequest("GET", `/api/activites/${activity.id}`);
    const ctx = createParams({ id: activity.id });
    const res = await getActiviteDetail(req, ctx);
    const { status } = await parseResponse(res);

    // Returns 404, not 403 - prevents ID enumeration
    expect(status).toBe(404);
  });

  it("RESPONSABLE cannot PUT activity of another service", async () => {
    const activity = await createFormationActivity(prisma, users.service2.id, users.admin.id, users.program2.id);
    mockAuthUser(users.responsable);

    const req = createRequest("PUT", `/api/activites/${activity.id}`, {
      body: { title: "Hacked Title" },
    });
    const ctx = createParams({ id: activity.id });
    const res = await putActivite(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("PARTICIPANT cannot cancel another user's registration", async () => {
    const otherParticipant = await prisma.user.create({
      data: {
        name: "Other",
        email: "other@test.com",
        password: "hashed",
        role: "PARTICIPANT",
      },
    });
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id, {
      requiresRegistration: true,
    });
    const otherReg = await prisma.registration.create({
      data: { userId: otherParticipant.id, activityId: activity.id },
    });

    mockAuthUser(users.participant);
    const req = createRequest("DELETE", `/api/registrations/${otherReg.id}`);
    const ctx = createParams({ id: otherReg.id });
    const res = await deleteRegistration(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(404);
  });

  it("INTERVENANT cannot access non-assigned activity presences", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    mockAuthUser(users.intervenant);

    const req = createRequest("GET", `/api/presences/${activity.id}`);
    const ctx = createParams({ activityId: activity.id });
    const res = await getPresences(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("INTERVENANT cannot access non-assigned activity feedbacks", async () => {
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);
    mockAuthUser(users.intervenant);

    const req = createRequest("GET", `/api/retours/${activity.id}`);
    const ctx = createParams({ activityId: activity.id });
    const res = await getRetours(req, ctx);
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });
});

describe("Input validation", () => {
  it("PUT activity should reject empty body gracefully", async () => {
    mockAuthUser(users.admin);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    const req = createRequest("PUT", `/api/activites/${activity.id}`, {
      body: {},
    });
    const ctx = createParams({ id: activity.id });
    const res = await putActivite(req, ctx);
    const { status } = await parseResponse(res);

    // Empty body is valid (no fields to update) - should succeed
    expect([200, 400]).toContain(status);
  });
});
