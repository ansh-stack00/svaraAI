"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mic, LayoutDashboard, Bot, Phone, BarChart3, LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/actions";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/agents", label: "Agents", icon: Bot },
  { href: "/dashboard/calls", label: "Call History", icon: Phone },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

export function DashboardNav({ user }) {
  const pathname = usePathname();

  return (
    <nav className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 border-b border-slate-700/50 backdrop-blur-sm shadow-lg">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-shadow">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">VoiceAgent</span>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`gap-2 transition-all duration-200 ${
                        isActive
                          ? "bg-blue-600/20 text-blue-300 hover:bg-blue-600/30"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400">
              {user?.email}
            </div>
            <div className="w-px h-6 bg-slate-700/50"></div>
            <form action={logout}>
              <Button 
                variant="ghost" 
                size="icon" 
                type="submit"
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
