"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  Calendar,
  Monitor,
  Home,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

/* ============= Types ============= */

type DelayStatus = "PENDING" | "APPROVED" | "REJECTED";

interface AttendanceRecord {
  _id: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  workMode?: "WFO" | "WFH";
  markedLate: boolean;
  delayReason?: string;
  delayStatus?: DelayStatus;
  adminRemarks?: string;
  approvedBy?: string;
  approvedAt?: string;
  status: "PRESENT" | "ABSENT";
  employee: {
    employeeId: string;
    email: string;
    role: string;
  };
}

interface EmployeeSummary {
  employeeId: string;
  email: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  wfhDays: number;
  wfoDays: number;
  totalDays: number;
}

type ActiveTab = "records" | "summary" | "pending";

/* ============= Helpers ============= */

const formatTime = (date?: string) => {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const DELAY_BADGE: Record<DelayStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 border border-red-200",
  },
};

/* ============= Component ============= */

export default function AdminAttendancePage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>("records");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  // Filters
  const [searchEmpId, setSearchEmpId] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [lateOnly, setLateOnly] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/");
      return;
    }
    if (activeTab === "records" || activeTab === "pending") {
      fetchRecords(token);
    } else {
      fetchSummary(token);
    }
  }, [token, authLoading, activeTab, selectedMonth]);

  const fetchRecords = useCallback(
    async (authToken: string) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filterDate) params.set("date", filterDate);
        if (activeTab === "pending") params.set("lateOnly", "true");
        else if (lateOnly) params.set("lateOnly", "true");

        const res = await fetch(
          `${API}/api/attendance/admin/all?${params.toString()}`,
          { headers: { Authorization: `Bearer ${authToken}` } },
        );
        if (res.status === 401) {
          router.push("/");
          return;
        }
        const data = await res.json();
        if (data.success) {
          let filtered = data.data as AttendanceRecord[];
          if (searchEmpId.trim()) {
            filtered = filtered.filter((r) =>
              r.employee?.employeeId
                ?.toLowerCase()
                .includes(searchEmpId.toLowerCase()),
            );
          }
          setRecords(filtered);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [filterDate, lateOnly, searchEmpId, activeTab],
  );

  const fetchSummary = useCallback(
    async (authToken: string) => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API}/api/attendance/admin/attnadance-summary?month=${selectedMonth}`,
          { headers: { Authorization: `Bearer ${authToken}` } },
        );
        const data = await res.json();
        if (data.success) setSummary(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [selectedMonth],
  );

  const handleDelayAction = async (
    attendanceId: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    if (!token) return;
    try {
      setActionLoading(attendanceId + status);
      const res = await fetch(
        `${API}/api/attendance/admin/${attendanceId}/delay-action`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            remarks: remarks[attendanceId] || "",
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setRecords((prev) =>
          prev.map((r) =>
            r._id === attendanceId
              ? {
                  ...r,
                  delayStatus: status,
                  adminRemarks: remarks[attendanceId] || "",
                }
              : r,
          ),
        );
        setExpandedRow(null);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const applyFilters = () => {
    if (token) fetchRecords(token);
  };

  const resetFilters = () => {
    setSearchEmpId("");
    setFilterDate("");
    setLateOnly(false);
    if (token) fetchRecords(token);
  };

  const pendingCount = records.filter(
    (r) => r.markedLate && r.delayStatus === "PENDING",
  ).length;

  const displayRecords =
    activeTab === "pending"
      ? records.filter((r) => r.markedLate && r.delayStatus === "PENDING")
      : records;

  /* ============= Render ============= */

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Attendance Management
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Monitor, filter, and manage employee attendance
          </p>
        </div>
        <button
          onClick={() =>
            token &&
            (activeTab === "summary"
              ? fetchSummary(token)
              : fetchRecords(token))
          }
          className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-full sm:w-fit overflow-x-auto no-scrollbar ">
        {(
          [
            {
              id: "records",
              label: "All",
              fullLabel: "All Records",
              icon: <Calendar className="w-3.5 h-3.5" />,
            },
            {
              id: "pending",
              label: "Pending",
              fullLabel: "Pending Approvals",
              icon: <AlertCircle className="w-3.5 h-3.5" />,
              badge: pendingCount,
            },
            {
              id: "summary",
              label: "Summary",
              fullLabel: "Monthly Summary",
              icon: <Users className="w-3.5 h-3.5" />,
            },
          ] as {
            id: ActiveTab;
            label: string;
            fullLabel?: string
            icon: React.ReactNode;
            badge?: number;
          }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            <span className="hidden xs:inline">
              {tab?.fullLabel || tab.label}
            </span>
            <span className="xs:hidden">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters (records tab only) */}
      {activeTab === "records" && (
    <div className="bg-white rounded-2xl border shadow-sm p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-end gap-4">
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-gray-400 mb-1 block">Employee ID</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              value={searchEmpId}
              onChange={(e) => setSearchEmpId(e.target.value)}
              placeholder="Search ID..."
              className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="min-w-[140px]">
          <label className="text-xs text-gray-400 mb-1 block">Date</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-4 lg:mb-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={lateOnly}
              onChange={(e) => setLateOnly(e.target.checked)}
              className="rounded"
            />
            Late Only
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="cursor-pointer flex-1 lg:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
          >
            <Filter className="w-3.5 h-3.5" />
            Apply
          </button>
          <button
            onClick={resetFilters}
            className="cursor-pointer text-sm text-gray-400 hover:text-gray-600 px-2 py-2"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )}

      {/* Monthly Summary Tab */}
      {activeTab === "summary" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              max={new Date().toISOString().slice(0, 7)}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-400">
              {summary.length} employees
            </span>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-400 tracking-wide">
                  <tr>
                    <th className="px-6 py-3">Employee ID</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3 text-center">Present</th>
                    <th className="px-6 py-3 text-center">Absent</th>
                    <th className="px-6 py-3 text-center">Late</th>
                    <th className="px-6 py-3 text-center">WFH</th>
                    <th className="px-6 py-3 text-center">WFO</th>
                    <th className="px-6 py-3 text-center">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-10 text-center text-gray-300"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : summary.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-10 text-center text-gray-300"
                      >
                        No data for this month.
                      </td>
                    </tr>
                  ) : (
                    summary.map((emp) => {
                      const pct =
                        emp.totalDays > 0
                          ? Math.round((emp.presentDays / emp.totalDays) * 100)
                          : 0;
                      return (
                        <tr key={emp.employeeId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-800">
                            {emp.employeeId}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {emp.email}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-green-600 font-semibold">
                              {emp.presentDays}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-red-500 font-semibold">
                              {emp.absentDays}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-yellow-600 font-semibold">
                              {emp.lateDays}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-purple-600">
                            {emp.wfhDays}
                          </td>
                          <td className="px-6 py-4 text-center text-blue-600">
                            {emp.wfoDays}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    pct >= 80
                                      ? "bg-green-500"
                                      : pct >= 60
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-600">
                                {pct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Records & Pending Tabs */}
      {(activeTab === "records" || activeTab === "pending") && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {activeTab === "pending"
                ? "Pending Late Approvals"
                : "Attendance Records"}
            </h3>
            <span className="text-xs text-gray-400">
              {displayRecords.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-400 tracking-wide">
                <tr>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Check In</th>
                  <th className="px-6 py-3">Check Out</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-gray-300"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : displayRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-gray-300"
                    >
                      {activeTab === "pending"
                        ? "No pending approvals 🎉"
                        : "No records found."}
                    </td>
                  </tr>
                ) : (
                  displayRecords.map((record) => (
                    <React.Fragment key={record._id}>
                      <tr
                        key={record._id}
                        className={`hover:bg-gray-50 transition ${
                          record.markedLate && record.delayStatus === "PENDING"
                            ? "bg-yellow-50/30"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800 text-sm">
                            {record.employee?.employeeId ?? "—"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {record.employee?.email ?? ""}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatTime(record.checkInTime)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatTime(record.checkOutTime)}
                        </td>
                        <td className="px-6 py-4">
                          {record.workMode ? (
                            <span className="flex items-center gap-1 text-xs text-gray-600">
                              {record.workMode === "WFH" ? (
                                <Home className="w-3.5 h-3.5 text-purple-500" />
                              ) : (
                                <Monitor className="w-3.5 h-3.5 text-blue-500" />
                              )}
                              {record.workMode}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {record.markedLate ? (
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                DELAY_BADGE[record.delayStatus ?? "PENDING"]
                                  .className
                              }`}
                            >
                              Late ·{" "}
                              {
                                DELAY_BADGE[record.delayStatus ?? "PENDING"]
                                  .label
                              }
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-medium">
                              On Time
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {record.markedLate && (
                            <button
                              onClick={() =>
                                setExpandedRow(
                                  expandedRow === record._id
                                    ? null
                                    : record._id,
                                )
                              }
                              className="text-gray-400 hover:text-gray-600 transition"
                            >
                              {expandedRow === record._id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded: Late Details + Approve/Reject */}
                      {expandedRow === record._id && record.markedLate && (
                        <tr
                          key={`${record._id}-detail`}
                          className="bg-amber-50/60"
                        >
                          <td colSpan={7} className="px-6 py-5">
                            <div className="space-y-3 max-w-2xl">
                              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                                Late Check-in Details
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-xs text-gray-400 mb-0.5">
                                    Employee Reason
                                  </p>
                                  <p className="text-gray-700 bg-white border rounded-lg px-3 py-2">
                                    {record.delayReason || (
                                      <span className="text-gray-300 italic">
                                        No reason provided
                                      </span>
                                    )}
                                  </p>
                                </div>

                                {record.delayStatus !== "PENDING" && (
                                  <div>
                                    <p className="text-xs text-gray-400 mb-0.5">
                                      Admin Remarks
                                    </p>
                                    <p className="text-gray-700 bg-white border rounded-lg px-3 py-2">
                                      {record.adminRemarks || (
                                        <span className="text-gray-300 italic">
                                          None
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {record.delayStatus === "PENDING" && (
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-xs text-gray-400 mb-1 block">
                                      Admin Remarks (optional)
                                    </label>
                                    <input
                                      type="text"
                                      value={remarks[record._id] || ""}
                                      onChange={(e) =>
                                        setRemarks((prev) => ({
                                          ...prev,
                                          [record._id]: e.target.value,
                                        }))
                                      }
                                      placeholder="Add a remark..."
                                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        handleDelayAction(
                                          record._id,
                                          "APPROVED",
                                        )
                                      }
                                      disabled={
                                        actionLoading ===
                                        record._id + "APPROVED"
                                      }
                                      className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      {actionLoading === record._id + "APPROVED"
                                        ? "Approving..."
                                        : "Approve"}
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDelayAction(
                                          record._id,
                                          "REJECTED",
                                        )
                                      }
                                      disabled={
                                        actionLoading ===
                                        record._id + "REJECTED"
                                      }
                                      className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      {actionLoading === record._id + "REJECTED"
                                        ? "Rejecting..."
                                        : "Reject"}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {record.delayStatus !== "PENDING" && (
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  {record.delayStatus === "APPROVED" ? (
                                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                                  )}
                                  {record.delayStatus} by {record.approvedBy}
                                  {record.approvedAt &&
                                    ` on ${formatDate(record.approvedAt)}`}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
