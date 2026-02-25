import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  serviceId: string | null;
  serviceName: string | null;
};

export async function requireAuth(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) {
    throw new AuthorizationError("Non autorisé", 401);
  }
  return session.user as unknown as SessionUser;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new AuthorizationError("Accès insuffisant", 403);
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(Role.ADMIN);
}

export async function requireServiceManager(serviceId: string): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role === Role.ADMIN) return user;
  if (user.role === Role.RESPONSABLE_SERVICE && user.serviceId === serviceId) return user;
  throw new AuthorizationError("Accès insuffisant", 403);
}

export class AuthorizationError extends Error {
  status: number;
  constructor(message: string, status: number = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

export function handleAuthError(error: unknown) {
  if (error instanceof AuthorizationError) {
    return { error: error.message, status: error.status };
  }
  throw error;
}
