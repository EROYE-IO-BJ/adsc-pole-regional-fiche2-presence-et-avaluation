"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const registered = searchParams.get("registered");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "waiting">(
    token ? "loading" : "waiting"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    async function verifyEmail() {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Votre email a été vérifié avec succès !");
      } else {
        setStatus("error");
        setMessage(data.error || "Erreur lors de la vérification");
      }
    }

    verifyEmail();
  }, [token]);

  if (status === "waiting") {
    return (
      <div className="text-center space-y-4">
        <Mail className="h-12 w-12 mx-auto text-primary" />
        <div>
          <h3 className="font-medium text-lg">Vérifiez votre boîte email</h3>
          <p className="text-muted-foreground mt-1">
            {registered
              ? "Un email de vérification vous a été envoyé. Cliquez sur le lien pour activer votre compte."
              : "Consultez votre boîte email pour le lien de vérification."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/connexion">Retour à la connexion</Link>
        </Button>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
        <p className="text-muted-foreground">Vérification en cours...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
        <div>
          <h3 className="font-medium text-lg">{message}</h3>
          <p className="text-muted-foreground mt-1">
            Vous pouvez maintenant vous connecter.
          </p>
        </div>
        <Button asChild>
          <Link href="/connexion">Se connecter</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <XCircle className="h-12 w-12 mx-auto text-red-600" />
      <div>
        <h3 className="font-medium text-lg">Échec de la vérification</h3>
        <p className="text-muted-foreground mt-1">{message}</p>
      </div>
      <Button asChild variant="outline">
        <Link href="/connexion">Retour à la connexion</Link>
      </Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#14355A] to-[#7DD3D0] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sèmè City</CardTitle>
          <CardDescription>Vérification de votre email</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <VerifyEmailContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
