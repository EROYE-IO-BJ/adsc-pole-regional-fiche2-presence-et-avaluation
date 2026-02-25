"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Activity = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  status: string;
  requiresRegistration: boolean;
  service: { name: string };
};

type Registration = {
  id: string;
  activityId: string;
};

export default function ParticipantActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  function loadData() {
    Promise.all([
      fetch("/api/activites").then((r) => r.json()),
      fetch("/api/registrations").then((r) => r.json()),
    ]).then(([acts, regs]) => {
      setActivities(acts);
      setRegistrations(regs);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadData();
  }, []);

  function isRegistered(activityId: string) {
    return registrations.some((r) => r.activityId === activityId);
  }

  function getRegistrationId(activityId: string) {
    return registrations.find((r) => r.activityId === activityId)?.id;
  }

  async function handleRegister(activityId: string) {
    setActionLoading(activityId);
    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId }),
    });

    if (res.ok) {
      toast.success("Inscription réussie");
      loadData();
    } else {
      const data = await res.json();
      toast.error(data.error || "Erreur lors de l'inscription");
    }
    setActionLoading(null);
  }

  async function handleUnregister(activityId: string) {
    const regId = getRegistrationId(activityId);
    if (!regId) return;

    setActionLoading(activityId);
    const res = await fetch(`/api/registrations/${regId}`, { method: "DELETE" });

    if (res.ok) {
      toast.success("Inscription annulée");
      loadData();
    } else {
      const data = await res.json();
      toast.error(data.error || "Erreur lors de l'annulation");
    }
    setActionLoading(null);
  }

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
        <h1 className="text-2xl font-bold">Activités disponibles</h1>
        <p className="text-muted-foreground">
          Découvrez et inscrivez-vous aux activités
        </p>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Aucune activité disponible pour le moment.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{activity.title}</CardTitle>
                    <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(activity.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {activity.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {activity.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">{activity.service.name}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {activity.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {activity.description}
                  </p>
                )}
                {activity.requiresRegistration && (
                  <div>
                    {isRegistered(activity.id) ? (
                      <div className="flex items-center gap-3">
                        <Badge variant="success">Inscrit(e)</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnregister(activity.id)}
                          disabled={actionLoading === activity.id}
                        >
                          {actionLoading === activity.id && (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          )}
                          Annuler
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleRegister(activity.id)}
                        disabled={actionLoading === activity.id}
                      >
                        {actionLoading === activity.id && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        S&apos;inscrire
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
