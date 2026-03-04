"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

function StarRatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 focus:outline-none"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                star <= value
                  ? "fill-[#D4A017] text-[#D4A017]"
                  : "text-gray-300 hover:text-[#D4A017]/50"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

interface ServiceFeedbackFormProps {
  token: string;
}

export function ServiceFeedbackForm({ token }: ServiceFeedbackFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [satisfactionRating, setSatisfactionRating] = useState(0);
  const [informationClarity, setInformationClarity] = useState<boolean | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (satisfactionRating === 0) {
      toast.error("Veuillez donner une note de satisfaction");
      return;
    }

    if (informationClarity === null) {
      toast.error("Veuillez indiquer si les informations étaient claires");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const data = {
      feedbackType: "SERVICE" as const,
      satisfactionRating,
      informationClarity,
      improvementSuggestion: formData.get("improvementSuggestion") as string,
      participantName: formData.get("participantName") as string,
      participantEmail: formData.get("participantEmail") as string,
      accessToken: token,
    };

    const res = await fetch("/api/retours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push(`/p/${token}/merci`);
    } else {
      const error = await res.json();
      toast.error(error.error || "Erreur lors de l'envoi");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Votre avis sur le service</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Satisfaction */}
          <StarRatingInput
            label="Êtes-vous satisfait(e) de l'accompagnement reçu ? *"
            value={satisfactionRating}
            onChange={setSatisfactionRating}
          />

          {/* Information clarity */}
          <div className="space-y-2">
            <Label>Les informations données étaient-elles claires ? *</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={informationClarity === true ? "default" : "outline"}
                size="sm"
                onClick={() => setInformationClarity(true)}
              >
                Oui
              </Button>
              <Button
                type="button"
                variant={informationClarity === false ? "default" : "outline"}
                size="sm"
                onClick={() => setInformationClarity(false)}
              >
                Non
              </Button>
            </div>
          </div>

          {/* Improvement suggestion */}
          <div className="space-y-2">
            <Label htmlFor="improvementSuggestion">
              Qu&apos;est-ce qui pourrait être amélioré ?
            </Label>
            <Textarea
              id="improvementSuggestion"
              name="improvementSuggestion"
              placeholder="Vos suggestions d'amélioration..."
              rows={4}
            />
          </div>

          {/* Optional identity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="participantName">Nom (optionnel)</Label>
              <Input
                id="participantName"
                name="participantName"
                placeholder="Votre nom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="participantEmail">Email (optionnel)</Label>
              <Input
                id="participantEmail"
                name="participantEmail"
                type="email"
                placeholder="email@exemple.com"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Envoyer mon avis
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
