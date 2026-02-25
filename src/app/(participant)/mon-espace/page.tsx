"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, ClipboardList, History, Loader2 } from "lucide-react";

type Stats = {
  attendances: number;
  feedbacks: number;
  registrations: number;
  upcomingActivities: number;
};

export default function ParticipantDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/participant/history").then((r) => r.json()),
      fetch("/api/registrations").then((r) => r.json()),
    ]).then(([history, registrations]) => {
      const upcoming = registrations.filter(
        (r: any) => new Date(r.activity.date) > new Date() && r.activity.status === "ACTIVE"
      );
      setStats({
        attendances: history.attendances?.length || 0,
        feedbacks: history.feedbacks?.length || 0,
        registrations: registrations.length || 0,
        upcomingActivities: upcoming.length,
      });
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
        <h1 className="text-2xl font-bold">Mon espace</h1>
        <p className="text-muted-foreground">
          Bienvenue sur votre espace participant
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats?.attendances || 0}</div>
            <p className="text-xs text-muted-foreground">Présences</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats?.feedbacks || 0}</div>
            <p className="text-xs text-muted-foreground">Évaluations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats?.registrations || 0}</div>
            <p className="text-xs text-muted-foreground">Inscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{stats?.upcomingActivities || 0}</div>
            <p className="text-xs text-muted-foreground">À venir</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-primary" />
              Activités disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Consultez et inscrivez-vous aux activités proposées.
            </p>
            <Button asChild>
              <Link href="/mon-espace/activites">
                <CalendarDays className="mr-2 h-4 w-4" />
                Voir les activités
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary" />
              Mon historique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Retrouvez vos présences et évaluations passées.
            </p>
            <Button asChild variant="outline">
              <Link href="/mon-espace/historique">
                Voir l&apos;historique
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
