"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Plus,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navigation = [
  {
    name: "Tableau de bord",
    href: "/tableau-de-bord",
    icon: LayoutDashboard,
  },
  {
    name: "Activités",
    href: "/activites",
    icon: CalendarDays,
  },
  {
    name: "Nouvelle activité",
    href: "/activites/nouvelle",
    icon: Plus,
  },
  {
    name: "Paramètres",
    href: "/parametres",
    icon: Settings,
  },
];

interface SidebarProps {
  serviceName: string;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ serviceName, open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r shadow-sm transition-transform lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <div>
            <h2 className="font-bold text-lg">Sèmè City</h2>
            <p className="text-xs text-muted-foreground truncate">{serviceName}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/tableau-de-bord" && pathname.startsWith(item.href) && item.href !== "/activites/nouvelle");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* Footer */}
        <div className="p-3">
          <form action="/api/auth/signout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              Déconnexion
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}
