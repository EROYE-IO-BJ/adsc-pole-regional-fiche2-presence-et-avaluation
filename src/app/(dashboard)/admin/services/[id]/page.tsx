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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Building2, Users } from "lucide-react";

type ServiceDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  users: { id: string; name: string; email: string; role: string }[];
  _count: { activities: number };
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  RESPONSABLE_SERVICE: "Responsable",
  INTERVENANT: "Intervenant",
  PARTICIPANT: "Participant",
};

const roleColors: Record<string, "default" | "secondary" | "success" | "warning"> = {
  ADMIN: "default",
  RESPONSABLE_SERVICE: "success",
  INTERVENANT: "secondary",
  PARTICIPANT: "warning",
};

export default function ServiceDetailPage() {
  const params = useParams();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/services/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setService(data);
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

  if (!service) {
    return <div className="text-center py-12 text-muted-foreground">Service non trouvé</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/services">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">{service.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{service.slug}</p>
        </div>
      </div>

      {service.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{service.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{service.users.length}</div>
            <p className="text-xs text-muted-foreground">Utilisateurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{service._count.activities}</div>
            <p className="text-xs text-muted-foreground">Activités</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Utilisateurs rattachés
          </CardTitle>
        </CardHeader>
        <CardContent>
          {service.users.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun utilisateur rattaché à ce service.
            </p>
          ) : (
            <div className="space-y-3">
              {service.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <Link
                      href={`/admin/utilisateurs/${user.id}`}
                      className="font-medium hover:underline"
                    >
                      {user.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant={roleColors[user.role]}>
                    {roleLabels[user.role]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
