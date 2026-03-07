"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FolderKanban, Loader2 } from "lucide-react";

type Program = {
  id: string;
  name: string;
  description: string | null;
  service: { name: string } | null;
  department: { name: string };
  _count: { activities: number };
};

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/programs")
      .then((r) => r.json())
      .then(setPrograms)
      .finally(() => setLoading(false));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programmes</h1>
          <p className="text-muted-foreground">
            Gérez les programmes de vos services
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/programmes/nouveau">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau programme
          </Link>
        </Button>
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Aucun programme</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Créez votre premier programme
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin/programmes/nouveau">
                <Plus className="mr-2 h-4 w-4" />
                Créer un programme
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {programs.map((program) => (
            <Link key={program.id} href={`/admin/programmes/${program.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{program.name}</h3>
                      {program.description && (
                        <p className="text-sm text-muted-foreground">
                          {program.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Département : {program.department.name}
                        {program.service && ` — Service : ${program.service.name}`}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {program._count.activities} activité(s)
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
