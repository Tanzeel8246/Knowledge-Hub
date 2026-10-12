import { Link, useLocation } from "wouter";
import { useAuth } from "@/App";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, ScrollText, BookMarked, HeartHandshake, Calendar, Scale, Sparkles, Heart, MapPin, LogOut, ChevronRight, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/quran", label: "Quran", icon: BookOpen },
  { href: "/hadith", label: "Hadith", icon: ScrollText },
  { href: "/books", label: "Books", icon: BookMarked },
  { href: "/research", label: "Scholar Research Suite", icon: Sparkles },
  { href: "/spiritual", label: "Tazkiyah & Awrad", icon: Heart },
  { href: "/community", label: "Mosques & Kids Corner", icon: MapPin },
  { href: "/duas", label: "Hisnul Muslim & Duas", icon: HeartHandshake },
  { href: "/trackers", label: "Worship Trackers", icon: Calendar },
  { href: "/fiqh", label: "Fiqh & Inheritance", icon: Scale },
  { href: "/learning", label: "Learning Paths", icon: GraduationCap },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">ا</span>
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">Islamic Research OS</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = location === href || (href !== "/" && location.startsWith(href));
          return (
            <Link key={href} href={href}>
              <a
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon size={18} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-10">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 h-full">
            <Sidebar />
            <button
              className="absolute top-4 right-4 text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={20} className="text-foreground" />
          </button>
          <span className="font-bold text-foreground">Islamic Research OS</span>
        </div>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
