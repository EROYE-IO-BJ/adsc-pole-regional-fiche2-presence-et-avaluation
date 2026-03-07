import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockAuthUser, createTestUsers } from "../../helpers/auth";
import { prisma } from "../../helpers/prisma";

const mockCreate = vi.fn().mockResolvedValue({
  content: [
    {
      type: "text",
      text: JSON.stringify({
        metadata: { objet: "Formation", date: "2025-01-15", lieu: "Salle A", animateur: "Jean" },
        participants: [
          { firstName: "Marie", lastName: "Diop", email: "marie@test.com", phone: null, organization: null, signed: true, confidence: "high" },
        ],
      }),
    },
  ],
});

// Mock Anthropic SDK as a class constructor
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

// Must import after mock
const { POST } = await import("@/app/api/import/parse-pdf/route");

let users: Awaited<ReturnType<typeof createTestUsers>>;

beforeEach(async () => {
  users = await createTestUsers(prisma);
  mockCreate.mockClear();
});

function createPdfFormData(content = "fake-pdf-content", filename = "test.pdf", type = "application/pdf") {
  const blob = new Blob([content], { type });
  const file = new File([blob], filename, { type });
  const formData = new FormData();
  formData.append("file", file);
  return formData;
}

function createFormDataRequest(formData: FormData) {
  return new Request("http://localhost:3000/api/import/parse-pdf", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/import/parse-pdf", () => {
  it("admin should parse PDF and get extracted data", async () => {
    mockAuthUser(users.admin);

    const formData = createPdfFormData();
    const req = createFormDataRequest(formData);
    const res = await POST(req as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.metadata).toBeDefined();
    expect(data.metadata.objet).toBe("Formation");
    expect(data.participants).toHaveLength(1);
    expect(data.participants[0].firstName).toBe("Marie");
  });

  it("RESPONSABLE should be able to parse PDF", async () => {
    mockAuthUser(users.responsable);

    const formData = createPdfFormData();
    const req = createFormDataRequest(formData);
    const res = await POST(req as any);

    expect(res.status).toBe(200);
  });

  it("should return 403 for INTERVENANT", async () => {
    mockAuthUser(users.intervenant);

    const formData = createPdfFormData();
    const req = createFormDataRequest(formData);
    const res = await POST(req as any);

    expect(res.status).toBe(403);
  });

  it("should return 403 for PARTICIPANT", async () => {
    mockAuthUser(users.participant);

    const formData = createPdfFormData();
    const req = createFormDataRequest(formData);
    const res = await POST(req as any);

    expect(res.status).toBe(403);
  });

  it("should return 400 without file", async () => {
    mockAuthUser(users.admin);

    const formData = new FormData();
    const req = createFormDataRequest(formData);
    const res = await POST(req as any);

    expect(res.status).toBe(400);
  });

  it("should return 400 for non-PDF file", async () => {
    mockAuthUser(users.admin);

    const blob = new Blob(["not pdf"], { type: "text/plain" });
    const file = new File([blob], "test.txt", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    const req = createFormDataRequest(formData);
    const res = await POST(req as any);

    expect(res.status).toBe(400);
  });

  it("should return 401 when not authenticated", async () => {
    const formData = createPdfFormData();
    const req = createFormDataRequest(formData);
    const res = await POST(req as any);

    expect(res.status).toBe(401);
  });

  it("should handle markdown code block in AI response", async () => {
    mockAuthUser(users.admin);
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: '```json\n{"metadata": {"objet": "Test"}, "participants": []}\n```',
        },
      ],
    });

    const formData = createPdfFormData();
    const req = createFormDataRequest(formData);
    const res = await POST(req as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.metadata.objet).toBe("Test");
  });
});
