"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type ProgramDetail = {
  id: string;
  name: string;
  description: string | null;
  serviceId: string;
  service: { id: string; name: string };
  _count: { activities: number };
};

type Service = {
  id: string;
  name: string;
};

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/programs/${params.id}`).then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
    ]).then(([programData, servicesData]) => {
      setProgram(programData);
      setServices(servicesData);
      setLoading(false);
    });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      serviceId: formData.get("serviceId") as string,
    };

    const res = await fetch(`/api/programs/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success("Programme mis à jour");
      const updated = await res.json();
      setProgram((prev) => (prev ? { ...prev, ...updated } : null));
    } else {
      const error = await res.json();
      toast.error(error.error || "Erreur lors de la mise à jour");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce programme ?")) return;

    const res = await fetch(`/api/programs/${params.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Programme supprimé");
      router.push("/admin/programmes");
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

  if (!program) {
    return <div className="text-center py-12 text-muted-foreground">Programme non trouvé</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/programmes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{program.name}</h1>
          <p className="text-sm text-muted-foreground">
            {program._count.activities} activité(s) associée(s)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modifier le programme</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                name="name"
                defaultValue={program.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={program.description || ""}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceId">Service</Label>
              <Select name="serviceId" defaultValue={program.serviceId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
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
    </div>
  );
}
