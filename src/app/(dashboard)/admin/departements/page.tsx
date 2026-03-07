"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GitBranch, Building2, FolderKanban, Loader2 } from "lucide-react";

type Department = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  organization: { id: string; name: string };
  _count: { services: number; programs: number };
};

export default function AdminDepartementsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((data) => {
        setDepartments(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Départements</h1>
        <p className="text-muted-foreground">
          Départements et leurs services associés
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <Link key={dept.id} href={`/admin/departements/${dept.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GitBranch className="h-5 w-5 text-primary" />
                  {dept.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  {dept.organization.name}
                </p>
                {dept.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {dept.description}
                  </p>
                )}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {dept._count.services} service{dept._count.services > 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <FolderKanban className="h-3.5 w-3.5" />
                    {dept._count.programs} programme{dept._count.programs > 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  {dept.slug}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {departments.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucun département.
        </div>
      )}
    </div>
  );
}
