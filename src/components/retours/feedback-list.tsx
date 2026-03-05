"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Star, ThumbsUp, CheckCircle } from "lucide-react";

interface SessionInfo {
  id: string;
  title: string | null;
  date: string | Date;
}

interface Feedback {
  id: string;
  overallRating: number | null;
  contentRating: number | null;
  organizationRating: number | null;
  comment: string | null;
  suggestions: string | null;
  wouldRecommend: boolean;
  participantName: string | null;
  participantEmail: string | null;
  feedbackType: string | null;
  satisfactionRating: number | null;
  informationClarity: boolean | null;
  improvementSuggestion: string | null;
  sessionId: string;
  session?: SessionInfo | null;
  createdAt: string | Date;
}

interface SessionData {
  id: string;
  title: string | null;
  date: string | Date;
  accessToken: string;
  _count: { attendances: number; feedbacks: number };
  [key: string]: any;
}

interface FeedbackListProps {
  feedbacks: Feedback[];
  stats: any;
  activityId: string;
  activityType?: string;
  sessions?: SessionData[];
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

function computeStats(feedbacks: Feedback[], isService: boolean) {
  if (feedbacks.length === 0) return null;

  if (isService) {
    const withRating = feedbacks.filter((f) => f.satisfactionRating != null);
    const count = withRating.length;
    if (count === 0) return null;
    const avgSatisfaction = (
      withRating.reduce((sum, f) => sum + (f.satisfactionRating || 0), 0) / count
    ).toFixed(1);
    const clarityPercent = Math.round(
      (feedbacks.filter((f) => f.informationClarity).length / feedbacks.length) * 100
    );
    return { avgSatisfaction, clarityPercent };
  }

  const formationFeedbacks = feedbacks.filter(
    (f) => f.feedbackType !== "SERVICE" && f.overallRating != null
  );
  if (formationFeedbacks.length === 0) return null;
  return {
    avgOverall: (
      formationFeedbacks.reduce((sum, f) => sum + (f.overallRating || 0), 0) /
      formationFeedbacks.length
    ).toFixed(1),
    avgContent: (
      formationFeedbacks.reduce((sum, f) => sum + (f.contentRating || 0), 0) /
      formationFeedbacks.length
    ).toFixed(1),
    avgOrganization: (
      formationFeedbacks.reduce((sum, f) => sum + (f.organizationRating || 0), 0) /
      formationFeedbacks.length
    ).toFixed(1),
    recommendPercent: Math.round(
      (formationFeedbacks.filter((f) => f.wouldRecommend).length /
        formationFeedbacks.length) *
        100
    ),
  };
}

export function FeedbackList({ feedbacks, stats: initialStats, activityId, activityType, sessions }: FeedbackListProps) {
  const isService = activityType === "SERVICE";
  const isFormation = activityType === "FORMATION";
  const showSessionFilter = isFormation && sessions && sessions.length > 1;

  const [selectedSessionId, setSelectedSessionId] = useState<string>("all");

  const filteredFeedbacks = useMemo(() => {
    if (selectedSessionId === "all") return feedbacks;
    return feedbacks.filter((f) => f.sessionId === selectedSessionId);
  }, [feedbacks, selectedSessionId]);

  // Recompute stats when filtered
  const stats = useMemo(() => {
    if (selectedSessionId === "all") return initialStats;
    return computeStats(filteredFeedbacks, isService);
  }, [selectedSessionId, filteredFeedbacks, initialStats, isService]);

  function handleExport() {
    const params = new URLSearchParams({ format: "csv", type: "feedbacks" });
    if (selectedSessionId !== "all") params.set("sessionId", selectedSessionId);
    window.open(`/api/activites/${activityId}/export?${params}`, "_blank");
  }

  function sessionLabel(s: SessionData) {
    return s.title || `Séance du ${new Date(s.date).toLocaleDateString("fr-FR")}`;
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      {stats && (
        <div className={`grid grid-cols-2 ${isService ? "sm:grid-cols-2" : "sm:grid-cols-4"} gap-4`}>
          {isService ? (
            <>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground">Satisfaction</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="h-4 w-4 fill-[#D4A017] text-[#D4A017]" />
                    <span className="font-bold">{stats.avgSatisfaction || "N/A"}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground">Clarté</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <CheckCircle className="h-4 w-4 text-[#2980B9]" />
                    <span className="font-bold">{stats.clarityPercent ?? "N/A"}%</span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground">Note globale</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="h-4 w-4 fill-[#D4A017] text-[#D4A017]" />
                    <span className="font-bold">{stats.avgOverall || "N/A"}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground">Contenu</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="h-4 w-4 fill-[#D4A017] text-[#D4A017]" />
                    <span className="font-bold">{stats.avgContent || "N/A"}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground">Organisation</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="h-4 w-4 fill-[#D4A017] text-[#D4A017]" />
                    <span className="font-bold">{stats.avgOrganization || "N/A"}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-sm text-muted-foreground">Recommandent</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <ThumbsUp className="h-4 w-4 text-[#2980B9]" />
                    <span className="font-bold">{stats.recommendPercent ?? "N/A"}%</span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Feedback Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Retours des participants</CardTitle>
            {showSessionFilter && (
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger className="w-[220px] h-8 text-sm">
                  <SelectValue placeholder="Toutes les séances" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les séances</SelectItem>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {sessionLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {filteredFeedbacks.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {filteredFeedbacks.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Aucun feedback reçu pour le moment.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredFeedbacks.map((feedback) => (
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
                    {feedback.feedbackType === "SERVICE" ? (
                      <StarRating rating={feedback.satisfactionRating || 0} />
                    ) : (
                      <StarRating rating={feedback.overallRating || 0} />
                    )}
                  </div>

                  {feedback.feedbackType === "SERVICE" ? (
                    <div className="space-y-1">
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Satisfaction: {feedback.satisfactionRating}/5</span>
                        <span>
                          Clarté: {feedback.informationClarity ? "Oui" : "Non"}
                        </span>
                      </div>
                      {feedback.improvementSuggestion && (
                        <p className="text-sm">
                          <strong>Améliorations :</strong> {feedback.improvementSuggestion}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
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
                    </>
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
