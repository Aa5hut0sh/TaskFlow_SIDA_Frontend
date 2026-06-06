"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Briefcase,
  CheckSquare,
  Users,
  LayoutDashboard,
} from "lucide-react";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const pathname = usePathname();

  const adminLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: Briefcase },
    { name: "All Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Team", href: "/team", icon: Users },
  ];

  const userLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Team", href: "/team", icon: Users }
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <nav className="sticky top-4 z-50 mx-4 md:mx-8 bg-background/80 backdrop-blur-md border rounded-2xl shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold tracking-tight text-primary">
              TaskFlow
            </span>
          </div>

          {/* Links (Perfectly Centered) */}
          <div className="hidden sm:flex sm:space-x-1 absolute left-1/2 -translate-x-1/2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold">{user?.name}</span>
              <span className="text-xs text-muted-foreground font-medium">
                {user?.role} | {user?.department}
              </span>
            </div>
            <div className="h-6 w-px bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="rounded-full"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
