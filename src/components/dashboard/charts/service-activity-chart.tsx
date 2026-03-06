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
  Legend,
} from "recharts";
import type { ServiceActivity } from "@/types/dashboard";

interface Props {
  data: ServiceActivity[];
}

export function ServiceActivityChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Présences et feedbacks par service</CardTitle>
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
        <CardTitle className="text-lg">Présences et feedbacks par service</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(250, data.length * 50)}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" fontSize={12} />
            <YAxis
              dataKey="service"
              type="category"
              fontSize={12}
              width={120}
              tick={{ fontSize: 11 }}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey="attendances" fill="#10b981" name="Présences" />
            <Bar dataKey="feedbacks" fill="#8b5cf6" name="Feedbacks" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
