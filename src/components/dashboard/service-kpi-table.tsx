"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown } from "lucide-react";
import type { ServiceKPI } from "@/types/dashboard";

type SortKey = keyof Pick<
  ServiceKPI,
  "serviceName" | "activitiesCount" | "attendancesCount" | "feedbacksCount" | "avgRating" | "feedbackRate" | "recommendationRate"
>;

const columns: { key: SortKey; label: string }[] = [
  { key: "serviceName", label: "Service" },
  { key: "activitiesCount", label: "Activités" },
  { key: "attendancesCount", label: "Présences" },
  { key: "feedbacksCount", label: "Feedbacks" },
  { key: "avgRating", label: "Note moy." },
  { key: "feedbackRate", label: "Taux feedback" },
  { key: "recommendationRate", label: "Recommandation" },
];

function ratingColor(rating: number | null): string {
  if (rating === null) return "";
  if (rating >= 4) return "text-green-600";
  if (rating >= 3) return "text-orange-500";
  return "text-red-500";
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="text-sm">{value}%</span>
    </div>
  );
}

export function ServiceKPITable() {
  const [data, setData] = useState<ServiceKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("serviceName");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/stats/by-service");
        if (!res.ok) return;
        const kpis: ServiceKPI[] = await res.json();
        setData(kpis);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">KPIs par service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const globalRow = data.find((s) => s.serviceId === "GLOBAL");
  const serviceRows = data.filter((s) => s.serviceId !== "GLOBAL");

  const sorted = [...serviceRows].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">KPIs par service</CardTitle>
      </CardHeader>
      <CardContent>
        {serviceRows.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune donnée disponible.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="py-2 px-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => (
                  <tr key={row.serviceId} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3">{row.serviceName}</td>
                    <td className="py-2 px-3">{row.activitiesCount}</td>
                    <td className="py-2 px-3">{row.attendancesCount}</td>
                    <td className="py-2 px-3">{row.feedbacksCount}</td>
                    <td className={`py-2 px-3 font-medium ${ratingColor(row.avgRating)}`}>
                      {row.avgRating !== null ? `${row.avgRating}/5` : "N/A"}
                    </td>
                    <td className="py-2 px-3">
                      <ProgressBar value={row.feedbackRate} color="bg-[#10b981]" />
                    </td>
                    <td className="py-2 px-3">
                      <ProgressBar value={row.recommendationRate} color="bg-[#8b5cf6]" />
                    </td>
                  </tr>
                ))}
                {globalRow && (
                  <tr className="border-t-2 font-bold bg-muted/30">
                    <td className="py-2 px-3">{globalRow.serviceName}</td>
                    <td className="py-2 px-3">{globalRow.activitiesCount}</td>
                    <td className="py-2 px-3">{globalRow.attendancesCount}</td>
                    <td className="py-2 px-3">{globalRow.feedbacksCount}</td>
                    <td className={`py-2 px-3 ${ratingColor(globalRow.avgRating)}`}>
                      {globalRow.avgRating !== null ? `${globalRow.avgRating}/5` : "N/A"}
                    </td>
                    <td className="py-2 px-3">
                      <ProgressBar value={globalRow.feedbackRate} color="bg-[#10b981]" />
                    </td>
                    <td className="py-2 px-3">
                      <ProgressBar value={globalRow.recommendationRate} color="bg-[#8b5cf6]" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
