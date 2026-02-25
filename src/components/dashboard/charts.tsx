"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardChartsProps {
  serviceId?: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function DashboardCharts({ serviceId }: DashboardChartsProps) {
  const [activityData, setActivityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/activites");
        if (res.ok) {
          const activities = await res.json();
          setActivityData(
            activities.slice(0, 10).map((a: any) => ({
              name: a.title.length > 15 ? a.title.slice(0, 15) + "..." : a.title,
              presences: a._count.attendances,
              feedbacks: a._count.feedbacks,
            }))
          );
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [serviceId]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Chargement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activityData.length === 0) {
    return null;
  }

  const statusData = [
    { name: "Présences", value: activityData.reduce((s, a) => s + a.presences, 0) },
    { name: "Feedbacks", value: activityData.reduce((s, a) => s + a.feedbacks, 0) },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Participation par activité</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="presences" fill="#10b981" name="Présences" />
              <Bar dataKey="feedbacks" fill="#8b5cf6" name="Feedbacks" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Répartition globale</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
