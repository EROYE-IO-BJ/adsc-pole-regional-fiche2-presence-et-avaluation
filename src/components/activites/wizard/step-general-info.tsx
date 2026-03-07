"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import type { WizardFormData } from "./activity-wizard";

type Service = { id: string; name: string };
type Program = { id: string; name: string; serviceId: string | null; service: { name: string } | null };
type Intervenant = { id: string; name: string; email: string };

interface StepGeneralInfoProps {
  data: WizardFormData;
  onChange: (partial: Partial<WizardFormData>) => void;
  onNext: () => void;
  services: Service[];
  programs: Program[];
  intervenants: Intervenant[];
  isAdmin: boolean;
  isResponsable: boolean;
  errors: Record<string, string>;
}

export function StepGeneralInfo({
  data,
  onChange,
  onNext,
  services,
  programs,
  intervenants,
  isAdmin,
  isResponsable,
  errors,
}: StepGeneralInfoProps) {
  const filteredPrograms = data.serviceId
    ? programs.filter((p) => p.serviceId === data.serviceId)
    : programs;

  return (
    <div className="space-y-4">
      {/* Activity Type */}
      <div className="space-y-2">
        <Label>Type d&apos;activité *</Label>
        <div className="flex gap-3">
          <Button
            type="button"
            className="flex-1 sm:flex-none"
            variant={data.activityType === "FORMATION" ? "default" : "outline"}
            onClick={() => onChange({ activityType: "FORMATION" })}
          >
            Formation / Coaching
          </Button>
          <Button
            type="button"
            className="flex-1 sm:flex-none"
            variant={data.activityType === "SERVICE" ? "default" : "outline"}
            onClick={() => onChange({ activityType: "SERVICE" })}
          >
            Service
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Atelier d'anglais - Niveau B1"
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Description de l'activité..."
          rows={3}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Date de début *</Label>
          <Input
            id="startDate"
            type="date"
            value={data.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
          />
          {errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Date de fin *</Label>
          <Input
            id="endDate"
            type="date"
            value={data.endDate}
            onChange={(e) => onChange({ endDate: e.target.value })}
          />
          {errors.endDate && <p className="text-sm text-destructive">{errors.endDate}</p>}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Lieu</Label>
        <Input
          id="location"
          value={data.location}
          onChange={(e) => onChange({ location: e.target.value })}
          placeholder="Salle A, Bâtiment principal"
        />
      </div>

      {/* Service */}
      {(isAdmin || isResponsable) && services.length > 0 && (
        <div className="space-y-2">
          <Label>Service</Label>
          <Select
            value={data.serviceId}
            onValueChange={(v) => onChange({ serviceId: v })}
          >
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

      {/* Program */}
      <div className="space-y-2">
        <Label>Programme *</Label>
        <Select
          value={data.programId}
          onValueChange={(v) => onChange({ programId: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un programme" />
          </SelectTrigger>
          <SelectContent>
            {filteredPrograms.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.programId && <p className="text-sm text-destructive">{errors.programId}</p>}
        {filteredPrograms.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Aucun programme disponible.{" "}
            <Link href="/admin/programmes/nouveau" className="text-primary underline">
              Créer un programme
            </Link>
          </p>
        )}
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label>Statut</Label>
        <Select
          value={data.status}
          onValueChange={(v) => onChange({ status: v as WizardFormData["status"] })}
        >
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

      {/* Intervenant */}
      {intervenants.length > 0 && (
        <div className="space-y-2">
          <Label>Intervenant</Label>
          <Select
            value={data.intervenantId}
            onValueChange={(v) => onChange({ intervenantId: v })}
          >
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

      {/* Registration required */}
      <div className="flex items-center gap-3">
        <input
          id="requiresRegistration"
          type="checkbox"
          checked={data.requiresRegistration}
          onChange={(e) => onChange({ requiresRegistration: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="requiresRegistration" className="cursor-pointer">
          Inscription préalable requise
        </Label>
      </div>
      {data.requiresRegistration && (
        <p className="text-xs text-muted-foreground -mt-2 ml-7">
          Les participants devront s&apos;inscrire à l&apos;avance pour pouvoir enregistrer leur présence.
        </p>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <Button type="button" onClick={onNext} className="w-full sm:w-auto">
          Suivant &rarr;
        </Button>
      </div>
    </div>
  );
}
