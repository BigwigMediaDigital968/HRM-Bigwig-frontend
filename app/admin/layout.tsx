"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import Sidebar from "./components/Sidebar";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || pathname === "/admin/login" || loading) return;
    if (!user || user.role !== "ADMIN") router.replace("/admin/login");
  }, [user, loading, mounted, pathname, router]);

  const pageTitle = useMemo(() => {
    if (pathname.includes("dashboard")) return "Dashboard";
    if (pathname.includes("employees")) return "Employee Directory";
    if (pathname.includes("leave-management")) return "Leave Requests";
    if (pathname.includes("attendance")) return "Attendance Tracking";
    return "Admin Panel";
  }, [pathname]);

  if (!mounted) return null;
  if (pathname === "/admin/login") return <>{children}</>;
  if (loading || !user || user.role !== "ADMIN") return <div className="h-screen bg-slate-900" />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={user} logout={logout} />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden lg:ml-72 transition-all duration-300">
        <header className="bg-white border-b border-slate-200 h-16 lg:h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center space-x-4">
            <button className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="text-lg lg:text-xl font-bold text-slate-800">{pageTitle}</h2>
          </div>
          <div className="hidden sm:block text-sm font-medium text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
            Admin Mode
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}