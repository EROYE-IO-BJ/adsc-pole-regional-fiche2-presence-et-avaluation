import { beforeAll, beforeEach, afterAll, vi } from "vitest";
import { prisma, cleanDatabase } from "./helpers/prisma";

// Mock auth globally
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

// Import the mocked auth
import { auth } from "@/lib/auth";

beforeAll(async () => {
  await prisma.$executeRawUnsafe(`SELECT 1`); // verify connection
});

beforeEach(async () => {
  await cleanDatabase();
  // Reset auth mock to unauthenticated
  vi.mocked(auth).mockResolvedValue(null as any);
});

afterAll(async () => {
  await prisma.$disconnect();
});
