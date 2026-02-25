"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

type UserDetail = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: string | null;
  serviceId: string | null;
  service: { id: string; name: string } | null;
  createdAt: string;
  _count: { createdActivities: number; registrations: number };
};

type Service = {
  id: string;
  name: string;
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  RESPONSABLE_SERVICE: "Responsable",
  INTERVENANT: "Intervenant",
  PARTICIPANT: "Participant",
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/users/${params.id}`).then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
    ]).then(([userData, servicesData]) => {
      setUser(userData);
      setServices(servicesData);
      setLoading(false);
    });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const role = formData.get("role") as string;
    const serviceId = formData.get("serviceId") as string;

    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role,
      serviceId: role === "ADMIN" || role === "PARTICIPANT" ? null : serviceId || null,
    };

    const res = await fetch(`/api/users/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success("Utilisateur mis à jour");
      const updated = await res.json();
      setUser((prev) => (prev ? { ...prev, ...updated } : null));
    } else {
      const error = await res.json();
      toast.error(error.error || "Erreur lors de la mise à jour");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;

    const res = await fetch(`/api/users/${params.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Utilisateur supprimé");
      router.push("/admin/utilisateurs");
    } else {
      const error = await res.json();
      toast.error(error.error || "Erreur lors de la suppression");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">Utilisateur non trouvé</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/utilisateurs">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge>{roleLabels[user.role]}</Badge>
            {!user.emailVerified && <Badge variant="warning">Non vérifié</Badge>}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modifier l&apos;utilisateur</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" name="name" defaultValue={user.name} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select name="role" defaultValue={user.role}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="RESPONSABLE_SERVICE">Responsable de service</SelectItem>
                  <SelectItem value="INTERVENANT">Intervenant</SelectItem>
                  <SelectItem value="PARTICIPANT">Participant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceId">Service</Label>
              <Select name="serviceId" defaultValue={user.serviceId || "none"}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucun service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun service</SelectItem>
                  {services.map((s: Service) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                Supprimer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{user._count.createdActivities}</div>
              <p className="text-xs text-muted-foreground">Activités créées</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{user._count.registrations}</div>
              <p className="text-xs text-muted-foreground">Inscriptions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
