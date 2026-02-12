"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isLeavesOpen, setIsLeavesOpen] = useState(true);

  /* ================= MOUNT FIX ================= */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* Keep leaves dropdown open when inside leaves */
  useEffect(() => {
    if (pathname.includes("/employee/leaves")) {
      setIsLeavesOpen(true);
    }
  }, [pathname]);

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    if (pathname === "/employee/login") return;

    if (!loading && mounted && user) {
      if (user.role !== "EMPLOYEE") {
        router.push("/employee/login");
      }

      if (
        user.verificationStatus !== "APPROVED" &&
        pathname !== "/employee/dashboard"
      ) {
        router.push("/employee/dashboard");
      }
    }
  }, [user, loading, mounted, pathname, router]);

  if (!mounted) return null;

  /* Login page should not show layout */
  if (pathname === "/employee/login") {
    return <>{children}</>;
  }

  if (loading || !user || user.role !== "EMPLOYEE") {
    return null;
  }

  /* ================= PAGE TITLE ================= */

  const getPageTitle = () => {
    if (pathname.includes("/employee/dashboard")) return "Dashboard";
    if (pathname.includes("/employee/leaves/apply")) return "Apply Leave";
    if (pathname.includes("/employee/leaves/cancel")) return "Cancel Leave";
    if (pathname.includes("/employee/leaves")) return "Leaves";
    if (pathname.includes("/employee/attendance")) return "Attendance";
    return "Employee Portal";
  };

  const isApproved = user.verificationStatus === "APPROVED";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20 left-0 top-0">
        {/* Branding */}
        <div className="p-6 border-b border-slate-800 shrink-0">
          <h1 className="text-2xl font-bold">Bigwig HRM</h1>
          <p className="text-slate-400 text-sm">Employee Portal</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Dashboard - Always visible */}
          <Link
            href="/employee/dashboard"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              pathname.includes("/employee/dashboard")
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>

          {/* ================= ONLY IF APPROVED ================= */}
          {isApproved && (
            <>
              {/* Leaves Section */}
              <div>
                <button
                  onClick={() => setIsLeavesOpen(!isLeavesOpen)}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${
                    pathname.includes("/employee/leaves")
                      ? "text-white bg-slate-800/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Calendar size={20} />
                    <span>Leaves</span>
                  </div>
                  {isLeavesOpen ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>

                {isLeavesOpen && (
                  <div className="mt-1 ml-4 space-y-1 border-l border-slate-800 pl-2">
                    <Link
                      href="/employee/leaves/apply"
                      className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                        pathname.includes("/employee/leaves/apply")
                          ? "text-blue-400 font-medium bg-slate-800/50"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                      }`}
                    >
                      <Calendar size={16} />
                      <span>Apply Leave</span>
                    </Link>

                    <Link
                      href="/employee/leaves/cancel"
                      className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                        pathname.includes("/employee/leaves/cancel")
                          ? "text-blue-400 font-medium bg-slate-800/50"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                      }`}
                    >
                      <Calendar size={16} />
                      <span>Cancel Leave</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Attendance */}
              <Link
                href="/employee/attendance"
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname.includes("/employee/attendance")
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Clock size={20} />
                <span>Attendance</span>
              </Link>
            </>
          )}
        </nav>

        {/* Logout */}
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

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col ml-64 h-full w-[calc(100%-16rem)]">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shrink-0 sticky top-0 z-10 w-full">
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
