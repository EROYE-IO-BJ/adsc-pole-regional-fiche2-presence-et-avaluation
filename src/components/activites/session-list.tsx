"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, UserCheck, Users, MessageSquare, Plus, QrCode, Trash2 } from "lucide-react";
import { SessionForm } from "./session-form";
import { toast } from "sonner";
import Link from "next/link";

interface SessionData {
  id: string;
  title: string | null;
  date: string | Date;
  location: string | null;
  accessToken: string;
  intervenant: { name: string } | null;
  _count: { attendances: number; feedbacks: number };
}

interface SessionListProps {
  sessions: SessionData[];
  activityId: string;
  canEdit: boolean;
}

export function SessionList({ sessions: initialSessions, activityId, canEdit }: SessionListProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [showForm, setShowForm] = useState(false);

  function handleSessionCreated(session: SessionData) {
    setSessions((prev) => [...prev, session].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    ));
    setShowForm(false);
    toast.success("Séance ajoutée");
  }

  async function handleDelete(sessionId: string) {
    if (sessions.length <= 1) {
      toast.error("Impossible de supprimer la dernière séance");
      return;
    }
    if (!confirm("Supprimer cette séance ?")) return;

    const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Séance supprimée");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Erreur lors de la suppression");
    }
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Séances</CardTitle>
          {canEdit && (
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une séance
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="mb-6 p-4 border rounded-md bg-muted/50">
              <SessionForm
                activityId={activityId}
                onCreated={handleSessionCreated}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Aucune séance pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border p-4"
                >
                  <Link
                    href={`/activites/${activityId}/seances/${s.id}`}
                    className="space-y-1 flex-1 hover:opacity-75 transition-opacity cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {s.title || `Séance du ${new Date(s.date).toLocaleDateString("fr-FR")}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(s.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {s.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {s.location}
                        </span>
                      )}
                      {s.intervenant && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5" />
                          {s.intervenant.name}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-3 text-sm">
                      <span className="flex items-center gap-1 text-[#2980B9]">
                        <Users className="h-4 w-4" />
                        {s._count.attendances}
                      </span>
                      <span className="flex items-center gap-1 text-[#D4A017]">
                        <MessageSquare className="h-4 w-4" />
                        {s._count.feedbacks}
                      </span>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const url = `${baseUrl}/p/${s.accessToken}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Lien de la séance copié");
                          }}
                          title="Copier le lien QR"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id)}
                          title={sessions.length <= 1 ? "Impossible de supprimer la dernière séance" : "Supprimer"}
                          disabled={sessions.length <= 1}
                        >
                          <Trash2 className={`h-4 w-4 ${sessions.length <= 1 ? "text-muted-foreground" : "text-destructive"}`} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
