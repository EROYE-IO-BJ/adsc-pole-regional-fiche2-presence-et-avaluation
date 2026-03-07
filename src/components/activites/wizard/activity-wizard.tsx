"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { generateSessions, presetConfig, type RecurrenceConfig } from "@/lib/recurrence";
import { step0Schema } from "@/lib/validations/activity";
import { WizardStepper } from "./wizard-stepper";
import { StepGeneralInfo } from "./step-general-info";
import { StepSchedule } from "./step-schedule";
import { StepSessionsPreview } from "./step-sessions-preview";
import { StepConfirmation } from "./step-confirmation";

export type WizardSession = {
  tempId: string;
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  deleted: boolean;
};

export type WizardFormData = {
  activityType: "FORMATION" | "SERVICE";
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  serviceId: string;
  programId: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  intervenantId: string;
  requiresRegistration: boolean;
  sessionFrequency: "UNIQUE" | "DAILY" | "WEEKLY" | "MONTHLY" | "CONFIGURABLE" | "CUSTOM";
  recurrenceConfig: RecurrenceConfig;
  startTime: string;
  endTime: string;
  usePerDaySlots: boolean;
  sessions: WizardSession[];
};

type Intervenant = { id: string; name: string; email: string };
type Service = { id: string; name: string };
type Program = { id: string; name: string; serviceId: string | null; service: { name: string } | null };

const STEPS = [
  { label: "Informations" },
  { label: "Planification" },
  { label: "Séances" },
  { label: "Confirmation" },
];

const initialFormData: WizardFormData = {
  activityType: "FORMATION",
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  location: "",
  serviceId: "",
  programId: "",
  status: "ACTIVE",
  intervenantId: "",
  requiresRegistration: false,
  sessionFrequency: "UNIQUE",
  recurrenceConfig: {
    interval: 1,
    unit: "week",
    daysOfWeek: [1],
    endType: "never",
  },
  startTime: "09:00",
  endTime: "17:00",
  usePerDaySlots: false,
  sessions: [],
};

export function ActivityWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sessionsGenerated, setSessionsGenerated] = useState(false);

  // Ref data
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  const isAdmin = session?.user?.role === "ADMIN";
  const isResponsable = session?.user?.role === "RESPONSABLE_SERVICE";

  useEffect(() => {
    fetch("/api/intervenants").then((r) => r.json()).then(setIntervenants).catch(() => {});
    if (isAdmin || isResponsable) {
      fetch("/api/services").then((r) => r.json()).then(setServices).catch(() => {});
    }
    fetch("/api/programs").then((r) => r.json()).then(setPrograms).catch(() => {});
  }, [isAdmin, isResponsable]);

  function updateFormData(partial: Partial<WizardFormData>) {
    setFormData((prev) => ({ ...prev, ...partial }));
  }

  // Determine which steps to show
  function getNextStep(from: number): number {
    const next = from + 1;
    if (formData.activityType === "SERVICE") {
      // Skip steps 1 and 2
      if (next === 1 || next === 2) return 3;
    }
    if (formData.sessionFrequency === "CONFIGURABLE" || formData.sessionFrequency === "UNIQUE") {
      // Skip step 2
      if (next === 2) return 3;
    }
    return next;
  }

  function getPrevStep(from: number): number {
    const prev = from - 1;
    if (formData.activityType === "SERVICE") {
      if (prev === 2 || prev === 1) return 0;
    }
    if (formData.sessionFrequency === "CONFIGURABLE" || formData.sessionFrequency === "UNIQUE") {
      if (prev === 2) return 1;
    }
    return prev;
  }

  // Generate sessions when entering step 2
  const generateWizardSessions = useCallback(() => {
    const isRecurrent = ["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"].includes(formData.sessionFrequency);
    if (!isRecurrent || !formData.startDate || !formData.endDate) {
      setFormData((prev) => ({ ...prev, sessions: [] }));
      return;
    }

    const hasDaySlots = formData.usePerDaySlots && formData.recurrenceConfig.dayTimeSlots &&
      Object.keys(formData.recurrenceConfig.dayTimeSlots).length > 0;

    const config: RecurrenceConfig =
      formData.sessionFrequency === "CUSTOM"
        ? formData.recurrenceConfig
        : {
            ...presetConfig(formData.sessionFrequency as "DAILY" | "WEEKLY" | "MONTHLY", new Date(formData.startDate)),
            dayTimeSlots: formData.recurrenceConfig.dayTimeSlots,
          };

    const generated = generateSessions(
      new Date(formData.startDate),
      new Date(formData.endDate),
      config,
      formData.startTime || "00:00",
      formData.endTime || "23:59"
    );

    const wizardSessions: WizardSession[] = generated.map((s) => ({
      tempId: crypto.randomUUID(),
      title: s.title,
      description: "",
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      deleted: false,
    }));

    setFormData((prev) => ({ ...prev, sessions: wizardSessions }));
    setSessionsGenerated(true);
  }, [formData.sessionFrequency, formData.startDate, formData.endDate, formData.startTime, formData.endTime, formData.recurrenceConfig, formData.usePerDaySlots]);

  // Validate step 0
  function validateStep0(): boolean {
    const result = step0Schema.safeParse({
      title: formData.title,
      startDate: formData.startDate,
      endDate: formData.endDate,
      programId: formData.programId,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  // Validate step 1
  function validateStep1(): boolean {
    const isRecurrent = ["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"].includes(formData.sessionFrequency);
    if (!isRecurrent) return true;

    const hasDaySlots = formData.usePerDaySlots && formData.recurrenceConfig.dayTimeSlots &&
      Object.keys(formData.recurrenceConfig.dayTimeSlots).length > 0;

    if (!hasDaySlots) {
      const fieldErrors: Record<string, string> = {};
      if (!formData.startTime) fieldErrors.startTime = "L'heure de début est requise";
      if (!formData.endTime) fieldErrors.endTime = "L'heure de fin est requise";
      if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
        fieldErrors.endTime = "L'heure de fin doit être après l'heure de début";
      }
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return false;
      }
    }
    setErrors({});
    return true;
  }

  function handleNext() {
    if (currentStep === 0) {
      if (!validateStep0()) return;
    }
    if (currentStep === 1) {
      if (!validateStep1()) return;
    }

    const next = getNextStep(currentStep);

    // If entering step 2, generate sessions
    if (next === 2) {
      if (sessionsGenerated && formData.sessions.length > 0) {
        // Warn user about regeneration
        const confirmed = window.confirm(
          "Les séances seront regénérées. Les modifications manuelles seront perdues. Continuer ?"
        );
        if (!confirmed) return;
      }
      generateWizardSessions();
    }

    setCurrentStep(next);
  }

  function handlePrev() {
    setErrors({});
    setCurrentStep(getPrevStep(currentStep));
  }

  function handleUpdateSession(tempId: string, updates: Partial<WizardSession>) {
    setFormData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.tempId === tempId ? { ...s, ...updates } : s
      ),
    }));
  }

  function handleDeleteSession(tempId: string) {
    setFormData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.tempId === tempId ? { ...s, deleted: true } : s
      ),
    }));
  }

  function handleRestoreSession(tempId: string) {
    setFormData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.tempId === tempId ? { ...s, deleted: false } : s
      ),
    }));
  }

  function handleResetSessions() {
    generateWizardSessions();
  }

  async function handleSubmit() {
    setLoading(true);

    const isRecurrent = ["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"].includes(formData.sessionFrequency);
    const activeSessions = formData.sessions.filter((s) => !s.deleted);

    const payload: any = {
      title: formData.title,
      description: formData.description || undefined,
      startDate: formData.startDate,
      endDate: formData.endDate,
      location: formData.location || undefined,
      status: formData.status,
      type: formData.activityType,
      requiresRegistration: formData.requiresRegistration,
      intervenantId: formData.intervenantId || undefined,
      programId: formData.programId,
      sessionFrequency: formData.activityType === "SERVICE" ? "UNIQUE" : formData.sessionFrequency,
    };

    if (formData.serviceId) {
      payload.serviceId = formData.serviceId;
    }

    if (isRecurrent && formData.activityType !== "SERVICE") {
      payload.recurrenceConfig = formData.recurrenceConfig;
      payload.startTime = formData.startTime;
      payload.endTime = formData.endTime;

      // Send pre-edited sessions if any were modified/deleted
      if (activeSessions.length > 0) {
        payload.sessions = activeSessions.map((s) => ({
          title: s.title,
          description: s.description || undefined,
          date: s.date instanceof Date ? s.date.toISOString().split("T")[0] : s.date,
          startTime: s.startTime,
          endTime: s.endTime,
        }));
      }
    }

    try {
      const res = await fetch("/api/activites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    } catch {
      toast.error("Erreur réseau");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
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

      {/* Stepper */}
      <WizardStepper currentStep={currentStep} steps={STEPS} />

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].label}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <StepGeneralInfo
              data={formData}
              onChange={updateFormData}
              onNext={handleNext}
              services={services}
              programs={programs}
              intervenants={intervenants}
              isAdmin={isAdmin}
              isResponsable={isResponsable}
              errors={errors}
            />
          )}

          {currentStep === 1 && (
            <StepSchedule
              data={formData}
              onChange={updateFormData}
              onNext={handleNext}
              onPrev={handlePrev}
              errors={errors}
            />
          )}

          {currentStep === 2 && (
            <StepSessionsPreview
              sessions={formData.sessions}
              onUpdateSession={handleUpdateSession}
              onDeleteSession={handleDeleteSession}
              onRestoreSession={handleRestoreSession}
              onReset={handleResetSessions}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}

          {currentStep === 3 && (
            <StepConfirmation
              data={formData}
              sessions={formData.sessions}
              programs={programs}
              services={services}
              intervenants={intervenants}
              onPrev={handlePrev}
              onSubmit={handleSubmit}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
