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
import { ArrowLeft, Loader2, Landmark, GitBranch, Building2, FolderKanban } from "lucide-react";

type Department = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { services: number; programs: number };
};

type OrganisationDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  departments: Department[];
};

export default function OrganisationDetailPage() {
  const params = useParams();
  const [organisation, setOrganisation] = useState<OrganisationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/organisations/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setOrganisation(data);
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

  if (!organisation) {
    return <div className="text-center py-12 text-muted-foreground">Organisation non trouvée</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/organisations">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">{organisation.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{organisation.slug}</p>
        </div>
      </div>

      {organisation.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{organisation.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Départements ({organisation.departments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {organisation.departments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun département dans cette organisation.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {organisation.departments.map((dept) => (
                <Link key={dept.id} href={`/admin/departements/${dept.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-4 pb-4">
                      <h3 className="font-semibold">{dept.name}</h3>
                      {dept.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {dept.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {dept._count.services} service{dept._count.services > 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <FolderKanban className="h-3.5 w-3.5" />
                          {dept._count.programs} programme{dept._count.programs > 1 ? "s" : ""}
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
