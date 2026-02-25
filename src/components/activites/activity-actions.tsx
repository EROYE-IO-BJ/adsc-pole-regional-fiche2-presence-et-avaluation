"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Pencil, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ActivityActionsProps {
  activityId: string;
  activityStatus: string;
}

export function ActivityActions({ activityId, activityStatus }: ActivityActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(status: string) {
    const res = await fetch(`/api/activites/${activityId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      toast.success("Statut mis à jour");
      router.refresh();
    } else {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/activites/${activityId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Activité supprimée");
      router.push("/activites");
    } else {
      toast.error("Erreur lors de la suppression");
      setLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {activityStatus !== "ACTIVE" && (
            <DropdownMenuItem onClick={() => handleStatusChange("ACTIVE")}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Activer
            </DropdownMenuItem>
          )}
          {activityStatus !== "CLOSED" && (
            <DropdownMenuItem onClick={() => handleStatusChange("CLOSED")}>
              <XCircle className="mr-2 h-4 w-4" />
              Clôturer
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;activité</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes les présences et feedbacks
              associés seront également supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
