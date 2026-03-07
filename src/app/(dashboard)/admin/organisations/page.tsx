"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Landmark, GitBranch, Loader2 } from "lucide-react";

type Organisation = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { departments: number };
};

export default function AdminOrganisationsPage() {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/organisations")
      .then((r) => r.json())
      .then((data) => {
        setOrganisations(data);
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
        <h1 className="text-2xl font-bold">Organisations</h1>
        <p className="text-muted-foreground">
          Structure organisationnelle de la plateforme
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organisations.map((org) => (
          <Link key={org.id} href={`/admin/organisations/${org.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Landmark className="h-5 w-5 text-primary" />
                  {org.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {org.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {org.description}
                  </p>
                )}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <GitBranch className="h-3.5 w-3.5" />
                    {org._count.departments} département{org._count.departments > 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  {org.slug}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {organisations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucune organisation.
        </div>
      )}
    </div>
  );
}
