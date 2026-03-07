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

interface FilterUser {
  id: string;
  name: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  RESPONSABLE_SERVICE: "Responsable",
  INTERVENANT: "Intervenant",
};

export function UserFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUserId = searchParams.get("userId") || "";
  const [users, setUsers] = useState<FilterUser[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/dashboard/filter-users");
        if (!res.ok) return;
        const data: FilterUser[] = await res.json();
        setUsers(data);
      } catch {
        // Silently fail
      }
    }
    fetchUsers();
  }, []);

  if (users.length === 0) return null;

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("userId");
    } else {
      params.set("userId", value);
    }
    const query = params.toString();
    router.push(`/tableau-de-bord${query ? `?${query}` : ""}`);
  }

  return (
    <div className="w-full max-w-xs">
      <Select value={currentUserId || "all"} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Tous les utilisateurs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les utilisateurs</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.name} ({ROLE_LABELS[u.role] || u.role})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
