"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ServiceKPI } from "@/types/dashboard";

export function ServiceFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentServiceId = searchParams.get("serviceId") || "";
  const [services, setServices] = useState<ServiceKPI[]>([]);

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch("/api/dashboard/stats/by-service");
        if (!res.ok) return;
        const data: ServiceKPI[] = await res.json();
        setServices(data.filter((s) => s.serviceId !== "GLOBAL"));
      } catch {
        // Silently fail
      }
    }
    fetchServices();
  }, []);

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("serviceId");
    } else {
      params.set("serviceId", value);
    }
    const query = params.toString();
    router.push(`/tableau-de-bord${query ? `?${query}` : ""}`);
  }

  return (
    <div className="w-full max-w-xs">
      <Select value={currentServiceId || "all"} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Tous les services" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les services</SelectItem>
          {services.map((s) => (
            <SelectItem key={s.serviceId} value={s.serviceId}>
              {s.serviceName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
