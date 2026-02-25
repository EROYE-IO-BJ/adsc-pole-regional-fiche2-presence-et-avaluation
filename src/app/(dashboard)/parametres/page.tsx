import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  RESPONSABLE_SERVICE: "Responsable de service",
  INTERVENANT: "Intervenant",
  PARTICIPANT: "Participant",
};

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Informations de votre compte</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Nom</p>
            <p className="font-medium">{session?.user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{session?.user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Rôle</p>
            <Badge className="mt-1">
              {roleLabels[session?.user?.role || ""] || session?.user?.role}
            </Badge>
          </div>
          {session?.user?.serviceName && (
            <div>
              <p className="text-sm text-muted-foreground">Service</p>
              <p className="font-medium">{session.user.serviceName}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
