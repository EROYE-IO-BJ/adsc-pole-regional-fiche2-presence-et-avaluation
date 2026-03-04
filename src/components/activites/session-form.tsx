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
      date: formData.get("date") as string,
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
          <Label htmlFor="session-date">Date *</Label>
          <Input id="session-date" name="date" type="datetime-local" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="session-location">Lieu</Label>
          <Input
            id="session-location"
            name="location"
            placeholder="Salle A"
          />
        </div>
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
