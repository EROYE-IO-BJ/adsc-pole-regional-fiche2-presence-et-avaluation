"use client";

import { useEffect, useState } from "react";
import type { DashboardStats } from "@/types/dashboard";
import { MonthlyTrendsChart } from "./charts/monthly-trends-chart";
import { TypeDistributionChart } from "./charts/type-distribution-chart";
import { ServiceActivityChart } from "./charts/service-activity-chart";
import { ServiceSatisfactionChart } from "./charts/service-satisfaction-chart";
import { RatingDistributionChart } from "./charts/rating-distribution-chart";
import { TopPrograms } from "./rankings/top-programs";
import { TopIntervenants } from "./rankings/top-intervenants";
import { TopActivities } from "./rankings/top-activities";
import { ClarityRateCard } from "./feedback/clarity-rate";
import { RecommendationRateCard } from "./feedback/recommendation-rate";

export function DashboardCharts() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("Erreur lors du chargement");
        const stats: DashboardStats = await res.json();
        setData(stats);
      } catch (err: any) {
        setError(err.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-64 rounded-lg border bg-card animate-pulse flex items-center justify-center"
          >
            <p className="text-muted-foreground text-sm">Chargement...</p>
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-muted-foreground text-sm">
          {error || "Impossible de charger les statistiques"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Monthly trends + Type distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <MonthlyTrendsChart data={data.monthlyTrends} />
        <TypeDistributionChart data={data.typeDistribution} />
      </div>

      {/* Row 2: Service activity + Service satisfaction */}
      <div className="grid gap-4 md:grid-cols-2">
        <ServiceActivityChart data={data.serviceActivity} />
        <ServiceSatisfactionChart data={data.serviceSatisfaction} />
      </div>

      {/* Row 3: Rating distribution + Feedback indicators */}
      <div className="grid gap-4 md:grid-cols-3">
        <RatingDistributionChart data={data.ratingDistribution} />
        <ClarityRateCard data={data.clarityRate} />
        <RecommendationRateCard data={data.recommendationRate} />
      </div>

      {/* Row 4: Rankings */}
      <div className="grid gap-4 md:grid-cols-3">
        <TopPrograms data={data.topPrograms} />
        <TopIntervenants data={data.topIntervenants} />
        <TopActivities data={data.topActivities} />
      </div>
    </div>
  );
}
