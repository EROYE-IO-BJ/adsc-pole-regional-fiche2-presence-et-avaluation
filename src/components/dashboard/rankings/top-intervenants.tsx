"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopIntervenant } from "@/types/dashboard";

interface Props {
  data: TopIntervenant[];
}

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-xs text-muted-foreground">N/A</span>;
  return (
    <span className="text-sm text-[#D4A017] font-medium">
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
      <span className="ml-1 text-xs text-muted-foreground">{rating}/5</span>
    </span>
  );
}

export function TopIntervenants({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 5 Intervenants</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            Aucun intervenant avec des activités
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top 5 Intervenants</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((intervenant, index) => (
          <div
            key={intervenant.id}
            className="flex items-center gap-3 rounded-md border p-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8b5cf6]/10 text-sm font-bold text-[#8b5cf6]">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{intervenant.name}</p>
              <p className="text-sm text-muted-foreground">
                {intervenant.activitiesCount} activité{intervenant.activitiesCount > 1 ? "s" : ""}
              </p>
            </div>
            <StarRating rating={intervenant.avgRating} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
