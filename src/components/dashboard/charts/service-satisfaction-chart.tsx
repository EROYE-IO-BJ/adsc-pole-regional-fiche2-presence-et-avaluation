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
} from "recharts";
import type { ServiceSatisfaction } from "@/types/dashboard";

interface Props {
  data: ServiceSatisfaction[];
}

export function ServiceSatisfactionChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Satisfaction par service</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-8">
            Aucune donnée disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Satisfaction par service</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(250, data.length * 50)}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 5]} fontSize={12} />
            <YAxis
              dataKey="service"
              type="category"
              fontSize={12}
              width={120}
              tick={{ fontSize: 11 }}
            />
            <Tooltip formatter={(value: number) => `${value}/5`} />
            <Bar dataKey="avgRating" fill="#D4A017" name="Note moyenne" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
