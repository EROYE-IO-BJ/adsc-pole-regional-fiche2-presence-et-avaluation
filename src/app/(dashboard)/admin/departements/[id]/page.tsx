"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, GitBranch, Building2, Users, CalendarDays, FolderKanban } from "lucide-react";

type Service = {
  id: string;
  name: string;
  slug: string;
  _count: { users: number; activities: number };
};

type DepartmentDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  organization: { id: string; name: string };
  services: Service[];
  _count: { programs: number };
};

export default function DepartementDetailPage() {
  const params = useParams();
  const [department, setDepartment] = useState<DepartmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/departments/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setDepartment(data);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!department) {
    return <div className="text-center py-12 text-muted-foreground">Département non trouvé</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/departements">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">{department.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {department.organization.name} &middot;{" "}
            <span className="font-mono">{department.slug}</span>
          </p>
        </div>
      </div>

      {department.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{department.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{department.services.length}</div>
            <p className="text-xs text-muted-foreground">Services</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{department._count.programs}</div>
            <p className="text-xs text-muted-foreground">Programmes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Services ({department.services.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {department.services.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun service dans ce département.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {department.services.map((service) => (
                <Link key={service.id} href={`/admin/services/${service.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-4 pb-4">
                      <h3 className="font-semibold">{service.name}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {service._count.users} utilisateur{service._count.users > 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {service._count.activities} activité{service._count.activities > 1 ? "s" : ""}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
