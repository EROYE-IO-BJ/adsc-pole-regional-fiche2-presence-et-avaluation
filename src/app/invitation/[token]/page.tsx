"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type InvitationInfo = {
  email: string;
  role: string;
  serviceName?: string;
  inviterName: string;
  expired: boolean;
  accepted: boolean;
};

const roleLabels: Record<string, string> = {
  INTERVENANT: "Intervenant",
  RESPONSABLE_SERVICE: "Responsable de service",
  ADMIN: "Administrateur",
};

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchInvitation() {
      const res = await fetch(`/api/invitations/accept?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setInfo(data);
      } else {
        setError("Invitation non trouvée");
      }
      setLoading(false);
    }
    fetchInvitation();
  }, [token]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        name: formData.get("name") as string,
        password: formData.get("password") as string,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setSuccess(true);
    } else {
      setError(data.error || "Erreur lors de l'acceptation");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#14355A] to-[#7DD3D0] p-4">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#14355A] to-[#7DD3D0] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <h3 className="font-medium text-lg">Compte créé avec succès !</h3>
              <p className="text-muted-foreground">
                Vous pouvez maintenant vous connecter.
              </p>
              <Button asChild>
                <Link href="/connexion">Se connecter</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#14355A] to-[#7DD3D0] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-red-600" />
              <h3 className="font-medium text-lg">{error}</h3>
              <Button asChild variant="outline">
                <Link href="/">Retour à l&apos;accueil</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (info?.accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#14355A] to-[#7DD3D0] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <h3 className="font-medium text-lg">
                Cette invitation a déjà été acceptée
              </h3>
              <Button asChild>
                <Link href="/connexion">Se connecter</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (info?.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#14355A] to-[#7DD3D0] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-red-600" />
              <h3 className="font-medium text-lg">
                Cette invitation a expiré
              </h3>
              <p className="text-muted-foreground">
                Contactez l&apos;administrateur pour obtenir une nouvelle invitation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#14355A] to-[#7DD3D0] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sèmè City</CardTitle>
          <CardDescription>
            Vous avez été invité(e) en tant que{" "}
            <strong>{roleLabels[info?.role || ""] || info?.role}</strong>
            {info?.serviceName && (
              <>
                {" "}
                pour le service <strong>{info.serviceName}</strong>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={info?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Jean Dupont"
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Accepter l&apos;invitation
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
