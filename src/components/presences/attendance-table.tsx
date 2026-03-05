"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Upload } from "lucide-react";
import { PdfImportDialog } from "@/components/import/pdf-import-dialog";

interface SessionInfo {
  id: string;
  title: string | null;
  date: string | Date;
}

interface Attendance {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  organization: string | null;
  signature: string | null;
  sessionId: string;
  session?: SessionInfo | null;
  createdAt: string | Date;
}

interface SessionData {
  id: string;
  title: string | null;
  date: string | Date;
  accessToken: string;
  _count: { attendances: number; feedbacks: number };
  [key: string]: any;
}

interface AttendanceTableProps {
  attendances: Attendance[];
  activityId: string;
  canImport?: boolean;
  sessions?: SessionData[];
  activityType?: string;
}

export function AttendanceTable({ attendances, activityId, canImport, sessions, activityType }: AttendanceTableProps) {
  const [importOpen, setImportOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("all");

  const isFormation = activityType === "FORMATION";
  const showSessionFilter = isFormation && sessions && sessions.length > 1;

  const filteredAttendances = useMemo(() => {
    if (selectedSessionId === "all") return attendances;
    return attendances.filter((a) => a.sessionId === selectedSessionId);
  }, [attendances, selectedSessionId]);

  function handleExport() {
    const params = new URLSearchParams({ format: "csv", type: "attendances" });
    if (selectedSessionId !== "all") params.set("sessionId", selectedSessionId);
    window.open(`/api/activites/${activityId}/export?${params}`, "_blank");
  }

  function sessionLabel(s: SessionData) {
    return s.title || `Séance du ${new Date(s.date).toLocaleDateString("fr-FR")}`;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg">Liste de présence</CardTitle>
          {showSessionFilter && (
            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
              <SelectTrigger className="w-[220px] h-8 text-sm">
                <SelectValue placeholder="Toutes les séances" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les séances</SelectItem>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {sessionLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex gap-2">
          {canImport && (
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importer PDF
            </Button>
          )}
          {filteredAttendances.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredAttendances.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            Aucune présence enregistrée pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Nom</th>
                  <th className="pb-3 font-medium text-muted-foreground">Email</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">
                    Téléphone
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">
                    Organisation
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">
                    Signature
                  </th>
                  {showSessionFilter && selectedSessionId === "all" && (
                    <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">
                      Séance
                    </th>
                  )}
                  <th className="pb-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendances.map((attendance) => (
                  <tr key={attendance.id} className="border-b last:border-0">
                    <td className="py-3">
                      {attendance.firstName} {attendance.lastName}
                    </td>
                    <td className="py-3">{attendance.email}</td>
                    <td className="py-3 hidden sm:table-cell">
                      {attendance.phone || "-"}
                    </td>
                    <td className="py-3 hidden md:table-cell">
                      {attendance.organization || "-"}
                    </td>
                    <td className="py-3 hidden md:table-cell">
                      {attendance.signature ? (
                        <img
                          src={attendance.signature}
                          alt="Signature"
                          className="h-8 w-auto"
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    {showSessionFilter && selectedSessionId === "all" && (
                      <td className="py-3 hidden lg:table-cell text-muted-foreground text-xs">
                        {attendance.session?.title ||
                          (attendance.session
                            ? new Date(attendance.session.date).toLocaleDateString("fr-FR")
                            : "-")}
                      </td>
                    )}
                    <td className="py-3">
                      {new Date(attendance.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      {canImport && (
        <PdfImportDialog
          activityId={activityId}
          open={importOpen}
          onOpenChange={setImportOpen}
          sessions={sessions}
          activityType={activityType}
          sessionId={selectedSessionId !== "all" ? selectedSessionId : undefined}
        />
      )}
    </Card>
  );
}
