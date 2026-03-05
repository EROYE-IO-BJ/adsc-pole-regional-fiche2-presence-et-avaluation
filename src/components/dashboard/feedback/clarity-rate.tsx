"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClarityRate } from "@/types/dashboard";

interface Props {
  data: ClarityRate;
}

export function ClarityRateCard({ data }: Props) {
  const rate = data.total > 0 ? Math.round((data.yes / data.total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Clarté de l&apos;information</CardTitle>
        <p className="text-xs text-muted-foreground">Feedbacks SERVICE uniquement</p>
      </CardHeader>
      <CardContent>
        {data.total === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Aucun feedback service
          </p>
        ) : (
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold text-[#2980B9]">{rate}%</div>
            <p className="text-sm text-muted-foreground">
              trouvent l&apos;information claire
            </p>
            <div className="flex justify-center gap-4 pt-2 text-sm">
              <span className="text-green-600">Oui : {data.yes}</span>
              <span className="text-red-500">Non : {data.no}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
