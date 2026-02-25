"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Attendance {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  organization: string | null;
  signature: string | null;
  createdAt: string | Date;
}

interface AttendanceTableProps {
  attendances: Attendance[];
  activityId: string;
}

export function AttendanceTable({ attendances, activityId }: AttendanceTableProps) {
  function handleExport() {
    window.open(
      `/api/activites/${activityId}/export?format=csv&type=attendances`,
      "_blank"
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Liste de présence</CardTitle>
        {attendances.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {attendances.length === 0 ? (
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
                  <th className="pb-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((attendance) => (
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
    </Card>
  );
}
