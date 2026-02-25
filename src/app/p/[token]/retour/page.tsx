"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
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
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 hover:text-yellow-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [contentRating, setContentRating] = useState(0);
  const [organizationRating, setOrganizationRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState(true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (overallRating === 0 || contentRating === 0 || organizationRating === 0) {
      toast.error("Veuillez donner une note pour chaque critère");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const data = {
      overallRating,
      contentRating,
      organizationRating,
      comment: formData.get("comment") as string,
      suggestions: formData.get("suggestions") as string,
      wouldRecommend,
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-lg space-y-4">
        <Link
          href={`/p/${token}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Votre avis</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Ratings */}
              <StarRatingInput
                label="Note globale *"
                value={overallRating}
                onChange={setOverallRating}
              />
              <StarRatingInput
                label="Qualité du contenu *"
                value={contentRating}
                onChange={setContentRating}
              />
              <StarRatingInput
                label="Organisation *"
                value={organizationRating}
                onChange={setOrganizationRating}
              />

              {/* Would Recommend */}
              <div className="space-y-2">
                <Label>Recommanderiez-vous cette activité ?</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={wouldRecommend ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWouldRecommend(true)}
                  >
                    Oui
                  </Button>
                  <Button
                    type="button"
                    variant={!wouldRecommend ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWouldRecommend(false)}
                  >
                    Non
                  </Button>
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="comment">Commentaire</Label>
                <Textarea
                  id="comment"
                  name="comment"
                  placeholder="Qu'avez-vous pensé de cette activité ?"
                  rows={3}
                />
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                <Label htmlFor="suggestions">Suggestions d&apos;amélioration</Label>
                <Textarea
                  id="suggestions"
                  name="suggestions"
                  placeholder="Comment pourrions-nous améliorer cette activité ?"
                  rows={3}
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
      </div>
    </div>
  );
}
