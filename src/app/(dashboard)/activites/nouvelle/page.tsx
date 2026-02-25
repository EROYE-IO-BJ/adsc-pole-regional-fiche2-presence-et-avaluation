"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

type Intervenant = {
  id: string;
  name: string;
  email: string;
};

type Service = {
  id: string;
  name: string;
};

export default function NewActivityPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    fetch("/api/intervenants").then((r) => r.json()).then(setIntervenants);
    if (isAdmin) {
      fetch("/api/services").then((r) => r.json()).then(setServices);
    }
  }, [isAdmin]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const data: any = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      date: formData.get("date") as string,
      location: formData.get("location") as string,
      status: formData.get("status") as string,
      requiresRegistration,
      intervenantId: (formData.get("intervenantId") as string) || undefined,
    };

    if (isAdmin) {
      data.serviceId = formData.get("serviceId") as string;
    }

    const res = await fetch("/api/activites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const activity = await res.json();
      toast.success("Activité créée avec succès");
      router.push(`/activites/${activity.id}`);
    } else {
      const error = await res.json();
      toast.error(error.error || "Erreur lors de la création");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/activites">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouvelle activité</h1>
          <p className="text-muted-foreground">
            Créez une nouvelle activité pour votre service
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l&apos;activité</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Atelier d'anglais - Niveau B1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Description de l'activité..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" name="date" type="datetime-local" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Lieu</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Salle A, Bâtiment principal"
                />
              </div>
            </div>

            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="serviceId">Service *</Label>
                <Select name="serviceId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un service" />
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
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select name="status" defaultValue="ACTIVE">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Brouillon</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="CLOSED">Clôturée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {intervenants.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="intervenantId">Intervenant</Label>
                <Select name="intervenantId">
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun intervenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {intervenants.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name} ({i.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                id="requiresRegistration"
                type="checkbox"
                checked={requiresRegistration}
                onChange={(e) => setRequiresRegistration(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="requiresRegistration" className="cursor-pointer">
                Inscription préalable requise
              </Label>
            </div>
            {requiresRegistration && (
              <p className="text-xs text-muted-foreground -mt-2 ml-7">
                Les participants devront s&apos;inscrire à l&apos;avance pour pouvoir enregistrer leur présence.
              </p>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer l&apos;activité
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/activites">Annuler</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
