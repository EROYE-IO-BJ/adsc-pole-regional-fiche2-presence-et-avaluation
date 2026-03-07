import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserServiceIds } from "@/lib/authorization";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireAuth();

    const filterRoles = [Role.ADMIN, Role.RESPONSABLE_SERVICE, Role.INTERVENANT];

    let userWhere: any = { role: { in: filterRoles } };

    if (user.role === Role.RESPONSABLE_SERVICE) {
      const serviceIds = await getUserServiceIds(user.id);
      userWhere = {
        role: { in: filterRoles },
        OR: [
          { role: Role.ADMIN },
          { services: { some: { serviceId: { in: serviceIds } } } },
          { intervenantActivities: { some: { serviceId: { in: serviceIds } } } },
        ],
      };
    }

    const users = await prisma.user.findMany({
      where: userWhere,
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    if (error?.name === "AuthorizationError") {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Filter users error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
