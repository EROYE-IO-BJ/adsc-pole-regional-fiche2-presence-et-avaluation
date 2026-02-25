"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, MapPin, Star, Loader2 } from "lucide-react";

type Attendance = {
  id: string;
  createdAt: string;
  activity: {
    id: string;
    title: string;
    date: string;
    location: string | null;
    service: { name: string };
  };
};

type FeedbackItem = {
  id: string;
  overallRating: number;
  createdAt: string;
  activity: {
    id: string;
    title: string;
    date: string;
    service: { name: string };
  };
};

export default function ParticipantHistoryPage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/participant/history")
      .then((r) => r.json())
      .then((data) => {
        setAttendances(data.attendances || []);
        setFeedbacks(data.feedbacks || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mon historique</h1>
        <p className="text-muted-foreground">
          Retrouvez vos présences et évaluations
        </p>
      </div>

      <Tabs defaultValue="presences">
        <TabsList>
          <TabsTrigger value="presences">
            Présences ({attendances.length})
          </TabsTrigger>
          <TabsTrigger value="evaluations">
            Évaluations ({feedbacks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presences">
          {attendances.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Aucune présence enregistrée.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {attendances.map((a) => (
                <Card key={a.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{a.activity.title}</h3>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {new Date(a.activity.date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                          {a.activity.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {a.activity.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {a.activity.service.name}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="evaluations">
          {feedbacks.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Aucune évaluation soumise.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((f) => (
                <Card key={f.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{f.activity.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(f.activity.date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{f.overallRating}/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
