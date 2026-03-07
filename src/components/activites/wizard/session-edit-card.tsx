"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { WizardSession } from "./activity-wizard";

interface SessionEditCardProps {
  session: WizardSession;
  onUpdate: (updates: Partial<WizardSession>) => void;
  onDelete: () => void;
  onRestore: () => void;
}

export function SessionEditCard({ session, onUpdate, onDelete, onRestore }: SessionEditCardProps) {
  const [editing, setEditing] = useState(false);

  if (session.deleted) {
    return (
      <div className="rounded-md border p-3 bg-muted/30 opacity-60">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm line-through text-muted-foreground">
              {format(session.date, "EEEE d MMMM yyyy", { locale: fr })}
              {session.startTime && session.endTime && (
                <span> &mdash; {session.startTime} &rarr; {session.endTime}</span>
              )}
            </p>
            <p className="text-sm line-through text-muted-foreground font-medium">
              {session.title}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onRestore}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Restaurer
          </Button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="rounded-md border p-3 space-y-2 border-primary/50">
        <div className="text-xs text-muted-foreground">
          {format(session.date, "EEEE d MMMM yyyy", { locale: fr })}
          {session.startTime && session.endTime && (
            <span> &mdash; {session.startTime} &rarr; {session.endTime}</span>
          )}
        </div>
        <Input
          value={session.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Titre de la séance"
        />
        <Textarea
          value={session.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Description (optionnel)"
          rows={2}
        />
        <div className="flex justify-end">
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
            Terminé
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border p-3 hover:bg-muted/20 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {format(session.date, "EEEE d MMMM yyyy", { locale: fr })}
            {session.startTime && session.endTime && (
              <span> &mdash; {session.startTime} &rarr; {session.endTime}</span>
            )}
          </p>
          <p className="text-sm font-medium truncate">{session.title}</p>
          {session.description && (
            <p className="text-xs text-muted-foreground truncate">{session.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
