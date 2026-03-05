"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TopActivity } from "@/types/dashboard";

interface Props {
  data: TopActivity[];
}

const TYPE_STYLES: Record<string, string> = {
  FORMATION: "bg-[#2980B9]/10 text-[#2980B9]",
  SERVICE: "bg-[#D4A017]/10 text-[#D4A017]",
};

export function TopActivities({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 5 Activités</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            Aucune activité notée
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top 5 Activités</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-center gap-3 rounded-md border p-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#10b981]/10 text-sm font-bold text-[#10b981]">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{activity.title}</p>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className={`text-xs ${TYPE_STYLES[activity.type] || ""}`}>
                  {activity.type === "FORMATION" ? "Formation" : "Service"}
                </Badge>
                <span className="text-muted-foreground">{activity.serviceName}</span>
                <span className="text-muted-foreground">
                  {activity.feedbacksCount} retour{activity.feedbacksCount > 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <span className="text-sm text-[#D4A017] font-medium">
              {"★".repeat(Math.round(activity.avgRating))}{"☆".repeat(5 - Math.round(activity.avgRating))}
              <span className="ml-1 text-xs text-muted-foreground">{activity.avgRating}/5</span>
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
