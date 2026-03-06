import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageSquare } from "lucide-react";

interface FeedbackStats {
  avgOverall?: string;
  avgContent?: string;
  avgOrganization?: string;
  recommendPercent?: number;
  avgSatisfaction?: string;
  clarityPercent?: number;
}

interface KpiStatsProps {
  attendancesCount: number;
  feedbacksCount: number;
  feedbackStats: FeedbackStats | null;
  isService: boolean;
}

export function KpiStats({ attendancesCount, feedbacksCount, feedbackStats, isService }: KpiStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-2">
            <Users className="h-5 w-5 text-[#2980B9]" />
          </div>
          <div className="text-2xl font-bold">{attendancesCount}</div>
          <p className="text-xs text-muted-foreground">Présences</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-2">
            <MessageSquare className="h-5 w-5 text-[#D4A017]" />
          </div>
          <div className="text-2xl font-bold">{feedbacksCount}</div>
          <p className="text-xs text-muted-foreground">Feedbacks</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="text-2xl font-bold">
            {isService
              ? feedbackStats && "avgSatisfaction" in feedbackStats
                ? `${feedbackStats.avgSatisfaction}/5`
                : "N/A"
              : feedbackStats && "avgOverall" in feedbackStats
                ? `${feedbackStats.avgOverall}/5`
                : "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            {isService ? "Satisfaction" : "Note moyenne"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="text-2xl font-bold">
            {isService
              ? feedbackStats && "clarityPercent" in feedbackStats
                ? `${feedbackStats.clarityPercent}%`
                : "N/A"
              : feedbackStats && "recommendPercent" in feedbackStats
                ? `${feedbackStats.recommendPercent}%`
                : "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            {isService ? "Clarté" : "Recommandent"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
