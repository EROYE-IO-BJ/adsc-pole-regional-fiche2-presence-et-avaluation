import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "@/app/api/participant/history/route";
import { parseResponse } from "../../helpers/api";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";
import { createFormationActivity, createTestAttendance, createTestFeedback } from "../../helpers/seed";

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
});

describe("GET /api/participant/history", () => {
  it("PARTICIPANT should get their attendance history", async () => {
    mockAuthUser(users.participant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    await createTestAttendance(prisma, activity.id, activity.sessions[0].id, {
      email: users.participant.email,
      firstName: "Participant",
      lastName: "Test",
    });

    const res = await GET();
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.attendances).toHaveLength(1);
    expect(data.attendances[0].activity).toBeDefined();
    expect(data.attendances[0].activity.title).toBe("Formation Test");
  });

  it("PARTICIPANT should get their feedback history", async () => {
    mockAuthUser(users.participant);
    const activity = await createFormationActivity(prisma, users.service.id, users.admin.id, users.program.id);

    await createTestFeedback(prisma, activity.id, activity.sessions[0].id, "FORMATION", {
      participantEmail: users.participant.email,
    });

    const res = await GET();
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.feedbacks).toHaveLength(1);
    expect(data.feedbacks[0].activity).toBeDefined();
  });

  it("should return empty arrays when no history", async () => {
    mockAuthUser(users.participant);

    const res = await GET();
    const { status, data } = await parseResponse(res);

    expect(status).toBe(200);
    expect(data.attendances).toHaveLength(0);
    expect(data.feedbacks).toHaveLength(0);
  });

  it("should return 403 for ADMIN", async () => {
    mockAuthUser(users.admin);

    const res = await GET();
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 403 for RESPONSABLE", async () => {
    mockAuthUser(users.responsable);

    const res = await GET();
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 403 for INTERVENANT", async () => {
    mockAuthUser(users.intervenant);

    const res = await GET();
    const { status } = await parseResponse(res);

    expect(status).toBe(403);
  });

  it("should return 401 when not authenticated", async () => {
    const res = await GET();
    const { status } = await parseResponse(res);

    expect(status).toBe(401);
  });
});
