"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Star, ThumbsUp } from "lucide-react";

interface Feedback {
  id: string;
  overallRating: number;
  contentRating: number;
  organizationRating: number;
  comment: string | null;
  suggestions: string | null;
  wouldRecommend: boolean;
  participantName: string | null;
  participantEmail: string | null;
  createdAt: string | Date;
}

interface FeedbackStats {
  avgOverall: string;
  avgContent: string;
  avgOrganization: string;
  recommendPercent: number;
}

interface FeedbackListProps {
  feedbacks: Feedback[];
  stats: FeedbackStats | null;
  activityId: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-[#D4A017] text-[#D4A017]"
              : "text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export function FeedbackList({ feedbacks, stats, activityId }: FeedbackListProps) {
  function handleExport() {
    window.open(
      `/api/activites/${activityId}/export?format=csv&type=feedbacks`,
      "_blank"
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">Note globale</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-[#D4A017] text-[#D4A017]" />
                <span className="font-bold">{stats.avgOverall}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">Contenu</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-[#D4A017] text-[#D4A017]" />
                <span className="font-bold">{stats.avgContent}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">Organisation</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-[#D4A017] text-[#D4A017]" />
                <span className="font-bold">{stats.avgOrganization}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">Recommandent</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <ThumbsUp className="h-4 w-4 text-[#2980B9]" />
                <span className="font-bold">{stats.recommendPercent}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Retours des participants</CardTitle>
          {feedbacks.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {feedbacks.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Aucun feedback reçu pour le moment.
            </p>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className="rounded-md border p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {feedback.participantName || "Anonyme"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(feedback.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <StarRating rating={feedback.overallRating} />
                  </div>

                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Contenu: {feedback.contentRating}/5</span>
                    <span>Organisation: {feedback.organizationRating}/5</span>
                    <span>
                      {feedback.wouldRecommend
                        ? "Recommande"
                        : "Ne recommande pas"}
                    </span>
                  </div>

                  {feedback.comment && (
                    <p className="text-sm">{feedback.comment}</p>
                  )}
                  {feedback.suggestions && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Suggestions :</strong> {feedback.suggestions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
