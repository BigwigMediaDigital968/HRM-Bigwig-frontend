"use client";

import { useAuth } from "@/app/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  LogOut,
  ChevronDown,
} from "lucide-react";

export default function EmployeePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [leaveOpen, setLeaveOpen] = useState(false);

  /* ===== AUTH CHECK ===== */
  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYEE")) {
      router.replace("/employee/login");
    }
  }, [user, loading, router]);

  /* Auto open dropdown if inside leaves */
  useEffect(() => {
    if (pathname.includes("/leaves")) {
      setLeaveOpen(true);
    }
  }, [pathname]);

  if (loading || !user) return null;

  /* ===== DYNAMIC HEADER TITLE ===== */

  const getTitle = () => {
    if (pathname.includes("/leaves/apply")) return "Apply Leave";
    if (pathname.includes("/leaves/cancel")) return "Cancel Leave";
    if (pathname.includes("/leaves")) return "Leaves";
    if (pathname.includes("/attendance")) return "Attendance";
    return "Dashboard";
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ===== SIDEBAR ===== */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-screen flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b">
            <h1 className="text-lg font-semibold text-gray-900">
              Employee Portal
            </h1>
          </div>

          {/* Menu */}
          <nav className="p-4 space-y-2">
            {/* Dashboard */}
            <Link
              href="/employee/dashboard"
              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${
                pathname.includes("/dashboard")
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>

            {/* ===== Leaves Dropdown ===== */}
            <button
              onClick={() => setLeaveOpen(!leaveOpen)}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm ${
                pathname.includes("/leaves")
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="flex items-center gap-3">
                <Calendar size={18} />
                Leaves
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform ${
                  leaveOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Items */}
            {leaveOpen && (
              <div className="ml-8 mt-1 space-y-1">
                <Link
                  href="/employee/leaves/apply"
                  className={`block px-3 py-2 rounded-md text-sm ${
                    pathname.includes("/leaves/apply")
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Apply Leave
                </Link>

                <Link
                  href="/employee/leaves/cancel"
                  className={`block px-3 py-2 rounded-md text-sm ${
                    pathname.includes("/leaves/cancel")
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Cancel Leave
                </Link>
              </div>
            )}

            {/* Attendance */}
            <Link
              href="/employee/attendance"
              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${
                pathname.includes("/attendance")
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Clock size={18} />
              Attendance
            </Link>
          </nav>
        </div>

        {/* Logout */}
        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* ===== RIGHT SIDE ===== */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* HEADER */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 fixed left-64 right-0 z-10">
          <h2 className="text-lg font-semibold text-gray-900">{getTitle()}</h2>

          <span className="text-sm text-gray-500">
            Welcome, <span className="font-medium">{user.name}</span>
          </span>
        </header>

        {/* CONTENT */}
        <main className="flex-1 pt-20 px-8 pb-8">{children}</main>
      </div>
    </div>
  );
}
