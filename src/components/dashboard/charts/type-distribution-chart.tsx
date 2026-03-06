"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { TypeDistribution } from "@/types/dashboard";

interface Props {
  data: TypeDistribution[];
}

const TYPE_COLORS: Record<string, string> = {
  FORMATION: "#2980B9",
  SERVICE: "#D4A017",
};

const TYPE_LABELS: Record<string, string> = {
  FORMATION: "Formation",
  SERVICE: "Service",
};

export function TypeDistributionChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Répartition par type</CardTitle>
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
    name: TYPE_LABELS[d.type] || d.type,
    value: d.count,
    color: TYPE_COLORS[d.type],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Répartition par type</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
            {/* Total au centre du donut */}
            <text
              x="50%"
              y="47%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground"
              style={{ fontSize: "24px", fontWeight: "bold" }}
            >
              {total}
            </text>
            <text
              x="50%"
              y="57%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground"
              style={{ fontSize: "12px" }}
            >
              activités
            </text>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
