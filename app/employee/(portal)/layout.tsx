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
  Menu,
  X,
  User,
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  /* ================= MOUNT FIX ================= */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* Close mobile sidebar on route change */
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  /* Keep leaves dropdown open when inside leaves */
  useEffect(() => {
    if (pathname.includes("/employee/leaves")) {
      setIsLeavesOpen(true);
    }
  }, [pathname]);

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    if (!mounted || loading) return;
    if (pathname === "/employee/login") return;

    if (!user) {
      router.push("/employee/login");
      return;
    }

    if (user.role !== "EMPLOYEE") {
      router.push("/employee/login");
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

  const getPageTitle = () => {
    if (pathname.includes("/employee/dashboard")) return "Dashboard";
    if (pathname.includes("/employee/leaves/apply")) return "Apply Leave";
    if (pathname.includes("/employee/leaves/cancel")) return "Cancel Leave";
    if (pathname.includes("/employee/leaves")) return "Leaves";
    if (pathname.includes("/employee/attendance")) return "Attendance";
    if (pathname.includes("/employee/profile")) return "Profile";
    return "Employee Portal";
  };

  const isApproved = user.verificationStatus === "APPROVED";

  const NavLinks = () => (
    <>
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

      {isApproved && (
        <>
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
              {isLeavesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {isLeavesOpen && (
              <div className="mt-1 ml-4 space-y-1 border-l border-slate-800 pl-2">
                <Link
                  href="/employee/leaves/apply"
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                    pathname === "/employee/leaves/apply"
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
                    pathname === "/employee/leaves/cancel"
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
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ================= MOBILE OVERLAY ================= */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR (Desktop & Mobile) ================= */}
      <aside
        className={`fixed inset-y-0 left-0 bg-slate-900 text-white flex flex-col z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Bigwig HRM</h1>
            <p className="text-slate-400 text-xs">Employee Portal</p>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white w-full transition-colors rounded-lg hover:bg-slate-800/50"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col h-full lg:ml-64 w-full">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 sm:h-20 flex items-center justify-between px-4 sm:px-10 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Hamburger Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg sm:text-2xl font-semibold text-slate-800 truncate">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden md:block text-right">
              <p className="text-xs text-slate-500">Welcome,</p>
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            </div>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="relative flex items-center focus:outline-none"
              >
                {user.profile?.photo?.url ? (
                  <img
                    src={user.profile.photo.url}
                    alt="Profile"
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-slate-200"
                  />
                ) : (
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-sm sm:text-lg shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-48 sm:w-56 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 md:hidden">
                    <p className="text-xs text-slate-500 uppercase">Employee</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                  </div>
                  <Link
                    href="/employee/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                  >
                    <User size={16} />
                    View Profile
                  </Link>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}