"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  Building2,
  Briefcase,
  FileText,
  Activity,
  RefreshCw,
  Check,
  X,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  status: string;
  isActive: boolean;
}

interface LeaveRequest {
  _id: string;
  employee: {
    employeeId: string;
    name: string;
    email: string;
  };
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  cancellationStatus?: string;
}

interface AttendanceRecord {
  _id: string;
  employee: {
    employeeId: string;
    name: string;
    email: string;
  };
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  workMode?: "WFO" | "WFH";
  markedLate: boolean;
  delayStatus?: "PENDING" | "APPROVED" | "REJECTED";
}

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  departments: number;
  designations: number;
}

/* ─── Helper Components ─────────────────────────────────────────────── */

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color,
  href,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  color: string;
  href?: string;
}) {
  const cardContent = (
    <div className="bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
              {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }
  return cardContent;
}

function PendingApprovalCard({
  title,
  count,
  icon: Icon,
  color,
  href,
  description,
}: {
  title: string;
  count: number;
  icon: React.ElementType;
  color: string;
  href: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all hover:border-blue-200 group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            {count > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-3 flex items-center text-sm text-blue-600 font-medium group-hover:text-blue-700">
        <span>View All</span>
        <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

function QuickActionButton({
  title,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  icon: React.ElementType;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl border bg-white hover:shadow-md transition-all hover:border-blue-200 group"
    >
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={18} />
      </div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{title}</span>
    </Link>
  );
}

/* ─── Main Dashboard Component ────────────────────────────────────────── */

export default function AdminDashboard() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    departments: 0,
    designations: 0,
  });
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [lateApprovals, setLateApprovals] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (authToken: string) => {
    try {
      setLoading(true);

      // Fetch employees
      const employeesRes = await fetch(`${API}/api/admin/employees`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const employeesData = await employeesRes.json();

      // Fetch leaves
      const leavesRes = await fetch(`${API}/api/leave/admin/all`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const leavesData = await leavesRes.json();

      // Fetch attendance with late only filter
      const attendanceRes = await fetch(`${API}/api/attendance/admin/all?lateOnly=true`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const attendanceData = await attendanceRes.json();

      // Fetch departments
      const deptRes = await fetch(`${API}/api/admin/departments`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const deptData = await deptRes.json();

      // Fetch designations
      const desigRes = await fetch(`${API}/api/admin/designations`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const desigData = await desigRes.json();

      // Process employees
      const allEmployees = employeesData.data || [];
      const totalEmployees = allEmployees.length;
      const activeEmployees = allEmployees.filter((e: Employee) => e.isActive === true).length;

      // Process leaves - get pending
      const allLeaves = leavesData.data || [];
      const pendingLeaves = allLeaves.filter(
        (l: LeaveRequest) => l.status === "PENDING"
      );

      // Process attendance - get pending late approvals
      const allAttendance = attendanceData.data || [];
      const pendingLateApprovals = allAttendance.filter(
        (a: AttendanceRecord) => a.markedLate && a.delayStatus === "PENDING"
      );

      setStats({
        totalEmployees,
        activeEmployees,
        departments: deptData.data?.length || 0,
        designations: desigData.data?.length || 0,
      });

      setLeaves(pendingLeaves);
      setLateApprovals(pendingLateApprovals);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/");
      return;
    }
    fetchDashboardData(token);
  }, [token, authLoading, router, fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (token) fetchDashboardData(token);
  };

  const pendingLeaveCount = leaves.length;
  const pendingLateCount = lateApprovals.length;
  const totalPendingApprovals = pendingLeaveCount + pendingLateCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back! Here's what's happening with your organization.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          color="bg-blue-100 text-blue-600"
          href="/admin/employee-management/employees"
        />
        <StatCard
          title="Active Employees"
          value={stats.activeEmployees}
          icon={Activity}
          color="bg-green-100 text-green-600"
          href="/admin/employee-management/employees"
        />
        <StatCard
          title="Departments"
          value={stats.departments}
          icon={Building2}
          color="bg-purple-100 text-purple-600"
          href="/admin/organization"
        />
        <StatCard
          title="Designations"
          value={stats.designations}
          icon={Briefcase}
          color="bg-orange-100 text-orange-600"
          href="/admin/organization"
        />
      </div>

      {/* Pending Approvals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Requests */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-yellow-600" />
              <h2 className="font-semibold text-gray-900">Pending Leave Requests</h2>
              {pendingLeaveCount > 0 && (
                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingLeaveCount}
                </span>
              )}
            </div>
            <Link
              href="/admin/employee-management/leave-management"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {pendingLeaveCount === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle size={40} className="mx-auto text-green-400 mb-2" />
                <p className="text-gray-500 text-sm">No pending leave requests</p>
              </div>
            ) : (
              leaves.slice(0, 5).map((leave) => (
                <div key={leave._id} className="px-5 py-3 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {leave.employee?.name || leave.employee?.employeeId}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {leave.employee?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {leave.totalDays} day{leave.totalDays > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="font-medium">Dates:</span>{" "}
                    {new Date(leave.fromDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    -{" "}
                    {new Date(leave.toDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
          {pendingLeaveCount > 5 && (
            <div className="px-5 py-3 border-t bg-gray-50">
              <Link
                href="/admin/employee-management/leave-management"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + {pendingLeaveCount - 5} more pending requests
              </Link>
            </div>
          )}
        </div>

        {/* Pending Late Approvals */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-orange-600" />
              <h2 className="font-semibold text-gray-900">Pending Late Approvals</h2>
              {pendingLateCount > 0 && (
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingLateCount}
                </span>
              )}
            </div>
            <Link
              href="/admin/attendance-management?tab=pending"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {pendingLateCount === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle size={40} className="mx-auto text-green-400 mb-2" />
                <p className="text-gray-500 text-sm">No pending late approvals</p>
              </div>
            ) : (
              lateApprovals.slice(0, 5).map((record) => (
                <div key={record._id} className="px-5 py-3 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {record.employee?.name || record.employee?.employeeId}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {record.employee?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(record.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {record.checkInTime && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(record.checkInTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {pendingLateCount > 5 && (
            <div className="px-5 py-3 border-t bg-gray-50">
              <Link
                href="/admin/attendance-management?tab=pending"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + {pendingLateCount - 5} more pending approvals
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <QuickActionButton
                title="Add Employee"
                icon={UserPlus}
                href="/admin/employee-management/employees"
                color="bg-blue-100 text-blue-600"
              />
              <QuickActionButton
                title="Leave Requests"
                icon={Calendar}
                href="/admin/employee-management/leave-management"
                color="bg-yellow-100 text-yellow-600"
              />
              <QuickActionButton
                title="Attendance"
                icon={Clock}
                href="/admin/attendance-management"
                color="bg-green-100 text-green-600"
              />
              <QuickActionButton
                title="Organization"
                icon={Building2}
                href="/admin/organization"
                color="bg-purple-100 text-purple-600"
              />
              <QuickActionButton
                title="Reports"
                icon={FileText}
                href="/admin/attendance-management?tab=summary"
                color="bg-orange-100 text-orange-600"
              />
              <QuickActionButton
                title="Directory"
                icon={Users}
                href="/admin/employee-management/employees"
                color="bg-cyan-100 text-cyan-600"
              />
            </div>
          </div>
        </div>

        {/* Alerts / Summary */}
        <div className="space-y-4">
          {/* Pending Approvals Alert */}
          {totalPendingApprovals > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertCircle size={20} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900">Action Required</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    You have <strong>{totalPendingApprovals}</strong> pending approval
                    {totalPendingApprovals > 1 ? "s" : ""} that need your attention.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {pendingLeaveCount > 0 && (
                      <Link
                        href="/admin/employee-management/leave-management"
                        className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-medium hover:bg-amber-200 transition"
                      >
                        {pendingLeaveCount} Leave{pendingLeaveCount > 1 ? "s" : ""}
                      </Link>
                    )}
                    {pendingLateCount > 0 && (
                      <Link
                        href="/admin/attendance-management?tab=pending"
                        className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-medium hover:bg-amber-200 transition"
                      >
                        {pendingLateCount} Late{pendingLateCount > 1 ? "s" : ""}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Clear Message */}
          {totalPendingApprovals === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">All Caught Up!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    There are no pending approvals at the moment. Great job staying on top of things!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Employees</span>
                <span className="font-semibold text-gray-900">{stats.totalEmployees}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Active Employees</span>
                <span className="font-semibold text-green-600">{stats.activeEmployees}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Departments</span>
                <span className="font-semibold text-gray-900">{stats.departments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Designations</span>
                <span className="font-semibold text-gray-900">{stats.designations}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
