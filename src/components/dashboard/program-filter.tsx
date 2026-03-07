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

interface Program {
  id: string;
  name: string;
}

export function ProgramFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentProgramId = searchParams.get("programId") || "";
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await fetch("/api/programs");
        if (!res.ok) return;
        const data = await res.json();
        setPrograms(data);
      } catch {
        // Silently fail
      }
    }
    fetchPrograms();
  }, []);

  if (programs.length === 0) return null;

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("programId");
    } else {
      params.set("programId", value);
    }
    const query = params.toString();
    router.push(`/tableau-de-bord${query ? `?${query}` : ""}`);
  }

  return (
    <div className="w-full max-w-xs">
      <Select value={currentProgramId || "all"} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Tous les programmes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les programmes</SelectItem>
          {programs.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
