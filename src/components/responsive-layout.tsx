"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Calendar,
  BarChart3,
  Database,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const navItems = [
    { name: "Calendar Ledger", href: "/", icon: Calendar },
    { name: "Analytics Dashboard", href: "/analytics", icon: BarChart3 },
    { name: "Master Data", href: "/master-data", icon: Database },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-50">
      {/* Mobile Top App Bar */}
      <header className="md:hidden flex items-center justify-between h-14 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 fixed top-0 w-full z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1 -ml-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
            NCL V3.0
          </span>
        </div>
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}
          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            CN
          </div>
        </div>
      </header>

      {/* Mobile Off-Canvas Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Tablet + Mobile Off-Canvas) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col w-64 md:w-20 lg:w-64 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="h-14 md:h-16 flex items-center justify-between px-4 lg:px-6 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight md:hidden lg:block">
            NCL V3.0
          </span>
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight hidden md:block lg:hidden mx-auto">
            N
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group flex items-center px-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50"
                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                <item.icon
                  className={`flex-shrink-0 w-5 h-5 ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300"
                  } md:mx-auto lg:mr-3 lg:mx-0`}
                />
                <span className="md:hidden lg:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between md:justify-center lg:justify-between">
            <div className="flex items-center gap-3 md:hidden lg:flex">
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
                CN
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate w-32">
                  Chief Nutritionist
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Admin
                </span>
              </div>
            </div>
            <div className="hidden md:flex lg:hidden h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
              CN
            </div>
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 hidden md:block"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
          </div>
          <button className="flex w-full items-center px-2 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <LogOut className="w-5 h-5 md:mx-auto lg:mr-3 lg:mx-0" />
            <span className="md:hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full pt-14 md:pt-0 md:ml-20 lg:ml-64 relative">
        <div className="flex-1 overflow-y-auto w-full p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
