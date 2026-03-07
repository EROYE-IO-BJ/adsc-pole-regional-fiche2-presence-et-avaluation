"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";
import { format, startOfWeek, startOfMonth, isSameWeek, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { SessionEditCard } from "./session-edit-card";
import type { WizardSession } from "./activity-wizard";

interface StepSessionsPreviewProps {
  sessions: WizardSession[];
  onUpdateSession: (tempId: string, updates: Partial<WizardSession>) => void;
  onDeleteSession: (tempId: string) => void;
  onRestoreSession: (tempId: string) => void;
  onReset: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const PAGE_SIZE = 20;

export function StepSessionsPreview({
  sessions,
  onUpdateSession,
  onDeleteSession,
  onRestoreSession,
  onReset,
  onNext,
  onPrev,
}: StepSessionsPreviewProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const activeCount = sessions.filter((s) => !s.deleted).length;
  const visibleSessions = sessions.slice(0, visibleCount);

  // Group sessions by week for visual separators
  const groupedSessions = useMemo(() => {
    const groups: { label: string; sessions: WizardSession[] }[] = [];
    let currentLabel = "";

    for (const session of visibleSessions) {
      const weekStart = startOfWeek(session.date, { weekStartsOn: 1 });
      const label = `Semaine du ${format(weekStart, "d MMMM yyyy", { locale: fr })}`;

      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, sessions: [] });
      }
      groups[groups.length - 1].sessions.push(session);
    }

    return groups;
  }, [visibleSessions]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {activeCount} séance{activeCount > 1 ? "s" : ""}
          </Badge>
          {activeCount < sessions.length && (
            <span className="text-xs text-muted-foreground">
              ({sessions.length - activeCount} supprimée{sessions.length - activeCount > 1 ? "s" : ""})
            </span>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Réinitialiser
        </Button>
      </div>

      {/* Session list grouped by week */}
      <div className="space-y-4">
        {groupedSessions.map((group) => (
          <div key={group.label} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-2">
              {group.sessions.map((session) => (
                <SessionEditCard
                  key={session.tempId}
                  session={session}
                  onUpdate={(updates) => onUpdateSession(session.tempId, updates)}
                  onDelete={() => onDeleteSession(session.tempId)}
                  onRestore={() => onRestoreSession(session.tempId)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {visibleCount < sessions.length && (
        <div className="text-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            Afficher {Math.min(PAGE_SIZE, sessions.length - visibleCount)} de plus
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onPrev} className="w-full sm:w-auto">
          &larr; Précédent
        </Button>
        <Button type="button" onClick={onNext} className="w-full sm:w-auto">
          Suivant &rarr;
        </Button>
      </div>
    </div>
  );
}
