"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Eraser } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import SignaturePad from "signature_pad";

export default function AttendancePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      // Set canvas size
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")!.scale(ratio, ratio);

      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: "rgb(255, 255, 255)",
      });
    }
  }, []);

  function clearSignature() {
    signaturePadRef.current?.clear();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      organization: formData.get("organization") as string,
      signature: signaturePadRef.current?.isEmpty()
        ? undefined
        : signaturePadRef.current?.toDataURL(),
      accessToken: token,
    };

    const res = await fetch("/api/presences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push(`/p/${token}/merci`);
    } else {
      const error = await res.json();
      toast.error(error.error || "Erreur lors de l'envoi");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted p-4">
      <div className="mx-auto max-w-lg space-y-4">
        <Link
          href={`/p/${token}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Feuille de présence</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Jean"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jean@exemple.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+229 XX XX XX XX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organisation</Label>
                <Input
                  id="organization"
                  name="organization"
                  placeholder="Sèmè City, Université, etc."
                />
              </div>

              {/* Signature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Signature</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSignature}
                  >
                    <Eraser className="mr-1 h-3 w-3" />
                    Effacer
                  </Button>
                </div>
                <canvas
                  ref={canvasRef}
                  className="w-full h-32 rounded-md border border-input cursor-crosshair"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer ma présence
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
