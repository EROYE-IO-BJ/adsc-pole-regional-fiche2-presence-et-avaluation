"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { RatingDistribution } from "@/types/dashboard";

interface Props {
  data: RatingDistribution[];
  onBarClick?: (rating: number) => void;
}

const RATING_COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

export function RatingDistributionChart({ data, onBarClick }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribution des notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-8">
            Aucune donnée disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    name: `${d.rating} étoile${d.rating > 1 ? "s" : ""}`,
    count: d.count,
    rating: d.rating,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribution des notes</CardTitle>
        {onBarClick && (
          <p className="text-xs text-muted-foreground">Cliquez sur une barre pour voir le détail</p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            onClick={(state) => {
              if (state?.activePayload?.[0] && onBarClick) {
                onBarClick(state.activePayload[0].payload.rating);
              }
            }}
            style={{ cursor: onBarClick ? "pointer" : undefined }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="Nombre" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={RATING_COLORS[index]} cursor={onBarClick ? "pointer" : undefined} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
