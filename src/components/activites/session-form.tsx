"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SessionFormProps {
  activityId: string;
  onCreated: (session: any) => void;
  onCancel: () => void;
}

type Intervenant = {
  id: string;
  name: string;
  email: string;
};

export function SessionForm({ activityId, onCreated, onCancel }: SessionFormProps) {
  const [loading, setLoading] = useState(false);
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);

  useEffect(() => {
    fetch("/api/intervenants")
      .then((r) => r.json())
      .then(setIntervenants)
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const data = {
      title: formData.get("title") as string,
      startDate: formData.get("startDate") as string,
      endDate: (formData.get("endDate") as string) || undefined,
      startTime: (formData.get("startTime") as string) || undefined,
      endTime: (formData.get("endTime") as string) || undefined,
      location: formData.get("location") as string,
      intervenantId: (formData.get("intervenantId") as string) || undefined,
      activityId,
    };

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const session = await res.json();
      onCreated({
        ...session,
        _count: { attendances: 0, feedbacks: 0 },
      });
    } else {
      const error = await res.json();
      toast.error(error.error || "Erreur lors de la création");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-medium">Nouvelle séance</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="session-title">Titre (optionnel)</Label>
          <Input
            id="session-title"
            name="title"
            placeholder="Séance 1 - Introduction"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="session-startDate">Date de début *</Label>
          <Input id="session-startDate" name="startDate" type="date" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="session-endDate">Date de fin</Label>
          <Input id="session-endDate" name="endDate" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="session-location">Lieu</Label>
          <Input
            id="session-location"
            name="location"
            placeholder="Salle A"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="session-startTime">Heure de début</Label>
          <Input id="session-startTime" name="startTime" type="time" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="session-endTime">Heure de fin</Label>
          <Input id="session-endTime" name="endTime" type="time" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {intervenants.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="session-intervenant">Intervenant</Label>
            <Select name="intervenantId">
              <SelectTrigger>
                <SelectValue placeholder="Intervenant par défaut" />
              </SelectTrigger>
              <SelectContent>
                {intervenants.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" size="sm" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ajouter
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
