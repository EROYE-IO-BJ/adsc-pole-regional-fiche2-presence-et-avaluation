"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { WizardFormData, WizardSession } from "./activity-wizard";

const FREQUENCY_LABELS: Record<string, string> = {
  UNIQUE: "Ne se répète pas",
  DAILY: "Tous les jours",
  WEEKLY: "Toutes les semaines",
  MONTHLY: "Tous les mois",
  CONFIGURABLE: "Configurable (ajout libre)",
  CUSTOM: "Personnalisé",
};

type Program = { id: string; name: string };
type Service = { id: string; name: string };
type Intervenant = { id: string; name: string };

interface StepConfirmationProps {
  data: WizardFormData;
  sessions: WizardSession[];
  programs: Program[];
  services: Service[];
  intervenants: Intervenant[];
  onPrev: () => void;
  onSubmit: () => void;
  loading: boolean;
}

export function StepConfirmation({
  data,
  sessions,
  programs,
  services,
  intervenants,
  onPrev,
  onSubmit,
  loading,
}: StepConfirmationProps) {
  const activeSessions = sessions.filter((s) => !s.deleted);
  const programName = programs.find((p) => p.id === data.programId)?.name ?? "—";
  const serviceName = services.find((s) => s.id === data.serviceId)?.name;
  const intervenantName = intervenants.find((i) => i.id === data.intervenantId)?.name;

  const statusLabels: Record<string, string> = {
    DRAFT: "Brouillon",
    ACTIVE: "Active",
    CLOSED: "Clôturée",
  };

  return (
    <div className="space-y-4">
      {/* Info section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">Titre : </span>
              <span className="font-medium">{data.title}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Type : </span>
              <Badge variant="outline">{data.activityType === "FORMATION" ? "Formation" : "Service"}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Début : </span>
              {data.startDate && format(new Date(data.startDate), "d MMMM yyyy", { locale: fr })}
            </div>
            <div>
              <span className="text-muted-foreground">Fin : </span>
              {data.endDate && format(new Date(data.endDate), "d MMMM yyyy", { locale: fr })}
            </div>
            {data.location && (
              <div>
                <span className="text-muted-foreground">Lieu : </span>
                {data.location}
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Programme : </span>
              {programName}
            </div>
            {serviceName && (
              <div>
                <span className="text-muted-foreground">Service : </span>
                {serviceName}
              </div>
            )}
            {intervenantName && (
              <div>
                <span className="text-muted-foreground">Intervenant : </span>
                {intervenantName}
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Statut : </span>
              {statusLabels[data.status]}
            </div>
            <div>
              <span className="text-muted-foreground">Inscription : </span>
              {data.requiresRegistration ? "Requise" : "Non requise"}
            </div>
          </div>
          {data.description && (
            <div className="pt-2">
              <span className="text-muted-foreground">Description : </span>
              <p className="mt-1 whitespace-pre-wrap">{data.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule section */}
      {data.activityType !== "SERVICE" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Planification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Fréquence : </span>
              {FREQUENCY_LABELS[data.sessionFrequency]}
            </div>
            {data.startTime && data.endTime && !data.usePerDaySlots && (
              <div>
                <span className="text-muted-foreground">Horaires : </span>
                {data.startTime} &rarr; {data.endTime}
              </div>
            )}
            {data.usePerDaySlots && data.recurrenceConfig.dayTimeSlots && (
              <div>
                <span className="text-muted-foreground">Horaires par jour :</span>
                <div className="mt-1 space-y-1">
                  {Object.entries(data.recurrenceConfig.dayTimeSlots).map(([day, slot]) => {
                    const dayNames: Record<string, string> = {
                      "0": "Dimanche", "1": "Lundi", "2": "Mardi", "3": "Mercredi",
                      "4": "Jeudi", "5": "Vendredi", "6": "Samedi",
                    };
                    return (
                      <p key={day} className="text-xs">
                        {dayNames[day]} : {slot.startTime} &rarr; {slot.endTime}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sessions section */}
      {activeSessions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Séances
              <Badge variant="secondary" className="ml-2">
                {activeSessions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {activeSessions.slice(0, 5).map((s) => (
              <p key={s.tempId} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{s.title}</span>
                {" — "}
                {format(s.date, "EEEE d MMMM yyyy", { locale: fr })}
                {s.startTime && s.endTime && ` de ${s.startTime} à ${s.endTime}`}
              </p>
            ))}
            {activeSessions.length > 5 && (
              <p className="text-xs text-muted-foreground italic">
                et {activeSessions.length - 5} autre{activeSessions.length - 5 > 1 ? "s" : ""}...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onPrev} className="w-full sm:w-auto">
          &larr; Modifier
        </Button>
        <Button type="button" onClick={onSubmit} disabled={loading} className="w-full sm:w-auto">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer l&apos;activité
        </Button>
      </div>
    </div>
  );
}
