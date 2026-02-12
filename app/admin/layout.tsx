"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import {
  LogOut,
  LayoutDashboard,
  Users,
  Calendar,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isEmployeeMgmtOpen, setIsEmployeeMgmtOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Keep dropdown open if we are in employee management section
    if (pathname.includes("/admin/employee-management")) {
      setIsEmployeeMgmtOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;
    if (pathname === "/admin/login") return;
    if (loading) return; // 🔴 VERY IMPORTANT

    if (!user || user.role !== "ADMIN") {
      router.replace("/admin/login");
    }
  }, [user, loading, mounted, pathname, router]);

  // Prevent flash of content or hydration mismatch
  if (!mounted) return null;

  // Special case for login page - render without sidebar/layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Show nothing while checking auth or if not admin
  if (loading) return null;

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  const getPageTitle = () => {
    if (pathname.includes("/admin/dashboard")) return "Dashboard";
    if (pathname.includes("/admin/employee-management/employees"))
      return "Employee Management";
    if (pathname.includes("/admin/employee-management/leave-management"))
      return "Leave Management";
    return "Admin Panel";
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Fixed */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20 left-0 top-0">
        <div className="p-6 border-b border-slate-800 shrink-0">
          <h1 className="text-2xl font-bold">Bigwig HRM</h1>
          <p className="text-slate-400 text-sm">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Dashboard Link */}
          <Link
            href="/admin/dashboard"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              pathname === "/admin/dashboard"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>

          {/* Employee Management Section */}
          <div>
            <button
              onClick={() => setIsEmployeeMgmtOpen(!isEmployeeMgmtOpen)}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${
                pathname.includes("/admin/employee-management")
                  ? "text-white bg-slate-800/50"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Users size={20} />
                <span>Employee Mgmt</span>
              </div>
              {isEmployeeMgmtOpen ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>

            {/* Submenu */}
            {isEmployeeMgmtOpen && (
              <div className="mt-1 ml-4 space-y-1 border-l border-slate-800 pl-2">
                <Link
                  href="/admin/employee-management/employees"
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                    pathname.includes("/admin/employee-management/employees")
                      ? "text-blue-400 font-medium bg-slate-800/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                  }`}
                >
                  <Users size={16} />
                  <span>Employees</span>
                </Link>
                <Link
                  href="/admin/employee-management/leave-management"
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                    pathname.includes(
                      "/admin/employee-management/leave-management",
                    )
                      ? "text-blue-400 font-medium bg-slate-800/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                  }`}
                >
                  <Calendar size={16} />
                  <span>Leave Management</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white w-full transition-colors rounded-lg hover:bg-slate-800/50"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col ml-64 h-full w-[calc(100%-16rem)]">
        {/* Header - Fixed at top of content area */}
        <header className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200 h-20 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">
            {getPageTitle()}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user.name}</span>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
