"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TopProgram } from "@/types/dashboard";

interface Props {
  data: TopProgram[];
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

export function TopPrograms({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 5 Programmes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            Aucun programme avec des participants
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top 5 Programmes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((program, index) => (
          <div
            key={program.id}
            className="flex items-center gap-3 rounded-md border p-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2980B9]/10 text-sm font-bold text-[#2980B9]">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{program.name}</p>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="text-xs">
                  {program.serviceName}
                </Badge>
                <span className="text-muted-foreground">
                  {program.participants} participant{program.participants > 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <StarRating rating={program.avgRating} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
