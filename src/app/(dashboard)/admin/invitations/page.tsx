"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Mail, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

type Invitation = {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  sender: { name: string };
  receiver: { name: string; email: string } | null;
};

type Service = {
  id: string;
  name: string;
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  RESPONSABLE_SERVICE: "Responsable",
  INTERVENANT: "Intervenant",
};

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);

  function loadInvitations() {
    fetch("/api/invitations")
      .then((r) => r.json())
      .then(setInvitations);
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/invitations").then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
    ]).then(([inv, srv]) => {
      setInvitations(inv);
      setServices(srv);
      setLoading(false);
    });
  }, []);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      role: formData.get("role") as string,
      serviceId: formData.get("serviceId") as string || undefined,
    };

    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success("Invitation envoyée");
      setDialogOpen(false);
      loadInvitations();
    } else {
      const error = await res.json();
      toast.error(error.error || "Erreur lors de l'envoi");
    }
    setSending(false);
  }

  function getStatus(inv: Invitation) {
    if (inv.acceptedAt) {
      return { label: "Acceptée", icon: CheckCircle, color: "text-green-600" };
    }
    if (new Date(inv.expiresAt) < new Date()) {
      return { label: "Expirée", icon: XCircle, color: "text-red-600" };
    }
    return { label: "En attente", icon: Clock, color: "text-yellow-600" };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invitations</h1>
          <p className="text-muted-foreground">
            Invitez des utilisateurs sur la plateforme
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Inviter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle invitation</DialogTitle>
              <DialogDescription>
                Envoyez une invitation par email
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inv-email">Email</Label>
                <Input
                  id="inv-email"
                  name="email"
                  type="email"
                  placeholder="email@exemple.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-role">Rôle</Label>
                <Select name="role" defaultValue="INTERVENANT">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTERVENANT">Intervenant</SelectItem>
                    <SelectItem value="RESPONSABLE_SERVICE">
                      Responsable de service
                    </SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-service">Service</Label>
                <Select name="serviceId">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={sending}>
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer l&apos;invitation
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {invitations.length} invitation{invitations.length > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune invitation.</p>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv) => {
                const status = getStatus(inv);
                const StatusIcon = status.icon;
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Invité par {inv.sender.name} le{" "}
                          {new Date(inv.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {roleLabels[inv.role]}
                      </Badge>
                      <span className={`flex items-center gap-1 text-xs ${status.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
