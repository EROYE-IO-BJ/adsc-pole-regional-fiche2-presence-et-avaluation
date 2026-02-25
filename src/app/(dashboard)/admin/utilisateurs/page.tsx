"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: string | null;
  service: { name: string } | null;
  createdAt: string;
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  RESPONSABLE_SERVICE: "Responsable",
  INTERVENANT: "Intervenant",
  PARTICIPANT: "Participant",
};

const roleColors: Record<string, "default" | "secondary" | "success" | "warning"> = {
  ADMIN: "default",
  RESPONSABLE_SERVICE: "success",
  INTERVENANT: "secondary",
  PARTICIPANT: "warning",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (roleFilter) params.set("role", roleFilter);
    if (search) params.set("search", search);

    fetch(`/api/users?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  }, [roleFilter, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <p className="text-muted-foreground">
          Gérez les utilisateurs de la plateforme
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            className="pl-10"
            value={search}
            onChange={(e) => {
              setLoading(true);
              setSearch(e.target.value);
            }}
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setLoading(true); setRoleFilter(v === "ALL" ? "" : v); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tous les rôles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les rôles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="RESPONSABLE_SERVICE">Responsable</SelectItem>
            <SelectItem value="INTERVENANT">Intervenant</SelectItem>
            <SelectItem value="PARTICIPANT">Participant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {users.length} utilisateur{users.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun utilisateur trouvé.</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/admin/utilisateurs/${user.id}`}
                    className="flex items-center justify-between border-b pb-3 last:border-0 hover:bg-muted/50 -mx-2 px-2 py-2 rounded transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name}</span>
                        {!user.emailVerified && (
                          <Badge variant="warning" className="text-xs">
                            Non vérifié
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.service && (
                        <p className="text-xs text-muted-foreground">
                          {user.service.name}
                        </p>
                      )}
                    </div>
                    <Badge variant={roleColors[user.role]}>
                      {roleLabels[user.role]}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
