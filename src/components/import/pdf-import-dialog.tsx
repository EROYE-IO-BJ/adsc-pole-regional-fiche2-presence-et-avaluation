"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface Participant {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  organization: string | null;
  signed: boolean;
  confidence: "high" | "low";
  selected: boolean;
}

interface SessionData {
  id: string;
  title: string | null;
  date: string | Date;
  accessToken: string;
  _count: { attendances: number; feedbacks: number };
  [key: string]: any;
}

interface PdfImportDialogProps {
  activityId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions?: SessionData[];
  activityType?: string;
  sessionId?: string;
}

type Step = "upload" | "preview" | "done";

export function PdfImportDialog({
  activityId,
  open,
  onOpenChange,
  sessions,
  activityType,
  sessionId: preSelectedSessionId,
}: PdfImportDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [result, setResult] = useState<{ created: number; duplicates: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const isFormation = activityType === "FORMATION";
  const multipleSessions = sessions && sessions.length > 1;
  const needsSessionPicker = isFormation && multipleSessions;

  // Auto-select: pre-selected > single session > undefined
  const autoSessionId = preSelectedSessionId || (sessions && sessions.length === 1 ? sessions[0].id : undefined);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(autoSessionId);

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setLoading(false);
    setError(null);
    setParticipants([]);
    setResult(null);
    setSelectedSessionId(preSelectedSessionId || (sessions && sessions.length === 1 ? sessions[0].id : undefined));
  }, [preSelectedSessionId, sessions]);

  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      if (step === "done") router.refresh();
      reset();
    }
    onOpenChange(isOpen);
  }, [step, router, reset, onOpenChange]);

  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf") {
      setError("Seuls les fichiers PDF sont acceptés");
      return;
    }
    setError(null);
    setFile(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'analyse");
      }

      const data = await res.json();
      setParticipants(
        (data.participants || []).map((p: Omit<Participant, "selected">) => ({
          ...p,
          selected: true,
        }))
      );
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const selected = participants.filter((p) => p.selected);
    if (selected.length === 0) return;

    // Require session selection for FORMATION with multiple sessions
    if (needsSessionPicker && !selectedSessionId) {
      setError("Veuillez sélectionner une séance avant d'importer");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/import/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId,
          sessionId: selectedSessionId,
          participants: selected.map(({ firstName, lastName, email, phone, organization }) => ({
            firstName,
            lastName,
            email,
            phone,
            organization,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'import");
      }

      const data = await res.json();
      setResult(data);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const updateParticipant = (index: number, field: keyof Participant, value: string | boolean) => {
    setParticipants((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const selectedCount = participants.filter((p) => p.selected).length;

  function sessionLabel(s: SessionData) {
    return s.title || `Séance du ${new Date(s.date).toLocaleDateString("fr-FR")}`;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Importer une fiche de présence PDF"}
            {step === "preview" && "Vérifier les données extraites"}
            {step === "done" && "Import terminé"}
          </DialogTitle>
        </DialogHeader>

        {/* UPLOAD STEP */}
        {step === "upload" && (
          <div className="space-y-4">
            {needsSessionPicker && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Séance cible</label>
                <Select value={selectedSessionId || ""} onValueChange={setSelectedSessionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une séance" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions!.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {sessionLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(1)} Mo)
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Glissez-déposez un fichier PDF ici, ou cliquez pour sélectionner
                  </p>
                  <p className="text-xs text-muted-foreground">PDF uniquement, max 32 Mo</p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <Button onClick={handleAnalyze} disabled={!file || loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  "Analyser le PDF"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* PREVIEW STEP */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedCount} participant{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
                {" "}sur {participants.length}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={reset}>
                  Recommencer
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </p>
            )}

            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 w-8">
                      <input
                        type="checkbox"
                        checked={selectedCount === participants.length}
                        onChange={(e) =>
                          setParticipants((prev) =>
                            prev.map((p) => ({ ...p, selected: e.target.checked }))
                          )
                        }
                      />
                    </th>
                    <th className="p-2 text-left font-medium">Prénom</th>
                    <th className="p-2 text-left font-medium">Nom</th>
                    <th className="p-2 text-left font-medium">Email</th>
                    <th className="p-2 text-left font-medium hidden sm:table-cell">Téléphone</th>
                    <th className="p-2 text-left font-medium hidden md:table-cell">Organisation</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p, i) => (
                    <tr key={i} className={`border-b last:border-0 ${!p.selected ? "opacity-40" : ""}`}>
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={p.selected}
                          onChange={(e) => updateParticipant(i, "selected", e.target.checked)}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={p.firstName}
                          onChange={(e) => updateParticipant(i, "firstName", e.target.value)}
                          className={`h-8 ${p.firstName === "???" ? "bg-yellow-100 border-yellow-400" : ""}`}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={p.lastName}
                          onChange={(e) => updateParticipant(i, "lastName", e.target.value)}
                          className={`h-8 ${p.lastName === "???" ? "bg-yellow-100 border-yellow-400" : ""}`}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={p.email}
                          onChange={(e) => updateParticipant(i, "email", e.target.value)}
                          className={`h-8 ${p.email === "???" ? "bg-yellow-100 border-yellow-400" : ""}`}
                        />
                      </td>
                      <td className="p-2 hidden sm:table-cell">
                        <Input
                          value={p.phone || ""}
                          onChange={(e) => updateParticipant(i, "phone", e.target.value)}
                          className={`h-8 ${p.phone === "???" ? "bg-yellow-100 border-yellow-400" : ""}`}
                        />
                      </td>
                      <td className="p-2 hidden md:table-cell">
                        <Input
                          value={p.organization || ""}
                          onChange={(e) => updateParticipant(i, "organization", e.target.value)}
                          className={`h-8 ${p.organization === "???" ? "bg-yellow-100 border-yellow-400" : ""}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleImport} disabled={selectedCount === 0 || loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  `Importer ${selectedCount} présence${selectedCount > 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </div>
        )}

        {/* DONE STEP */}
        {step === "done" && result && (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <div className="space-y-1">
              <p className="text-lg font-medium">
                {result.created} présence{result.created > 1 ? "s" : ""} importée{result.created > 1 ? "s" : ""}
              </p>
              {result.duplicates > 0 && (
                <p className="text-sm text-muted-foreground">
                  {result.duplicates} doublon{result.duplicates > 1 ? "s" : ""} ignoré{result.duplicates > 1 ? "s" : ""}
                </p>
              )}
            </div>
            <Button onClick={() => handleClose(false)}>Fermer</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
