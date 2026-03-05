"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, QrCode, ClipboardList, MessageSquare, CalendarDays } from "lucide-react";
import { toast } from "sonner";

interface SessionInfo {
  id: string;
  title: string | null;
  date: string | Date;
  accessToken: string;
  isDefault: boolean;
}

interface QRCodeSectionProps {
  accessToken: string;
  activityTitle: string;
  sessions?: SessionInfo[];
}

export function QRCodeSection({ accessToken, activityTitle, sessions }: QRCodeSectionProps) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const links = {
    landing: `${baseUrl}/p/${accessToken}`,
    presence: `${baseUrl}/p/${accessToken}/presence`,
    feedback: `${baseUrl}/p/${accessToken}/retour`,
  };

  return (
    <div className="space-y-6">
      {/* Landing page QR */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <QrCode className="h-5 w-5" />
            Page d&apos;accueil (Présence + Feedback)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <QRCode value={links.landing} size={200} />
          </div>
          <CopyLink url={links.landing} />
        </CardContent>
      </Card>

      {/* Individual QR codes */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" />
              Feuille de présence
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="bg-white p-3 rounded-lg border">
              <QRCode value={links.presence} size={150} />
            </div>
            <CopyLink url={links.presence} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Formulaire de feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="bg-white p-3 rounded-lg border">
              <QRCode value={links.feedback} size={150} />
            </div>
            <CopyLink url={links.feedback} />
          </CardContent>
        </Card>
      </div>

      {/* Per-session QR codes */}
      {sessions && sessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            QR codes par séance
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {sessions.map((s) => {
              const sessionUrl = `${baseUrl}/p/${s.accessToken}`;
              const label = s.title || `Séance du ${new Date(s.date).toLocaleDateString("fr-FR")}`;
              return (
                <Card key={s.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{label}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <div className="bg-white p-3 rounded-lg border">
                      <QRCode value={sessionUrl} size={150} />
                    </div>
                    <CopyLink url={sessionUrl} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex gap-2 w-full">
      <Input value={url} readOnly className="text-xs" />
      <Button variant="outline" size="icon" onClick={handleCopy}>
        {copied ? (
          <Check className="h-4 w-4 text-[#2980B9]" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
