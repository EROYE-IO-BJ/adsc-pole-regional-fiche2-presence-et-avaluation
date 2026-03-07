"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star } from "lucide-react";
import Link from "next/link";

interface FeedbackDetail {
  id: string;
  participantName: string | null;
  participantEmail: string | null;
  overallRating: number | null;
  satisfactionRating: number | null;
  contentRating: number | null;
  organizationRating: number | null;
  wouldRecommend: boolean;
  informationClarity: boolean | null;
  comment: string | null;
  suggestions: string | null;
  improvementSuggestion: string | null;
  feedbackType: string | null;
  createdAt: string;
  activity: { id: string; title: string; type: string };
  session: { id: string; title: string | null; startDate: string } | null;
}

interface FeedbackDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  filter: string;
  value: string;
  serviceId?: string;
  programId?: string;
  userId?: string;
}

export function FeedbackDetailDialog({
  open,
  onOpenChange,
  title,
  filter,
  value,
  serviceId,
  programId,
  userId,
}: FeedbackDetailDialogProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackDetail[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const params = new URLSearchParams({ filter, value });
    if (serviceId) params.set("serviceId", serviceId);
    if (programId) params.set("programId", programId);
    if (userId) params.set("userId", userId);
    fetch(`/api/dashboard/feedback-details?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setFeedbacks(data);
      })
      .finally(() => setLoading(false));
  }, [open, filter, value, serviceId, programId, userId]);

  function getRating(f: FeedbackDetail) {
    return f.overallRating || f.satisfactionRating;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {loading ? "Chargement..." : `${feedbacks.length} résultat${feedbacks.length > 1 ? "s" : ""}`}
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : feedbacks.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            Aucun feedback trouvé
          </p>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((f) => {
              const rating = getRating(f);
              return (
                <div key={f.id} className="rounded-md border p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {f.participantName || "Anonyme"}
                      </span>
                      {f.participantEmail && (
                        <span className="text-xs text-muted-foreground">
                          {f.participantEmail}
                        </span>
                      )}
                    </div>
                    {rating && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < rating ? "fill-[#D4A017] text-[#D4A017]" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Link
                      href={`/activites/${f.activity.id}`}
                      className="text-primary underline hover:no-underline"
                    >
                      {f.activity.title}
                    </Link>
                    <Badge variant="secondary" className="text-xs">
                      {f.activity.type === "FORMATION" ? "Formation" : "Service"}
                    </Badge>
                    {f.wouldRecommend !== undefined && (
                      <span className={f.wouldRecommend ? "text-green-600" : "text-red-500"}>
                        {f.wouldRecommend ? "Recommande" : "Ne recommande pas"}
                      </span>
                    )}
                    {f.informationClarity !== null && (
                      <span className={f.informationClarity ? "text-green-600" : "text-red-500"}>
                        {f.informationClarity ? "Info claire" : "Info pas claire"}
                      </span>
                    )}
                  </div>

                  {(f.comment || f.suggestions || f.improvementSuggestion) && (
                    <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
                      {f.comment && <p>{f.comment}</p>}
                      {f.suggestions && <p className="italic">Suggestion : {f.suggestions}</p>}
                      {f.improvementSuggestion && <p className="italic">Amélioration : {f.improvementSuggestion}</p>}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {new Date(f.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
