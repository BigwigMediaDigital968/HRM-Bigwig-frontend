"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
  Monitor,
  Home,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Timer,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import MarkAttendanceButton from "./MarkAttendanceButton";

const API = process.env.NEXT_PUBLIC_API_URL;

/* ─────────────── types ─────────────── */

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
  status: "PRESENT" | "ABSENT";
}

interface AttendanceSummary {
  month: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays?: number;
  wfhDays?: number;
  wfoDays?: number;
}

/* ─────────────── helpers ─────────────── */

const formatTime = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const calcWorkingHours = (checkIn?: string, checkOut?: string): string => {
  if (!checkIn) return "—";
  const start = new Date(checkIn).getTime();
  const end = checkOut ? new Date(checkOut).getTime() : Date.now();
  const diffMs = end - start;
  if (diffMs <= 0) return "—";
  const totalMins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hrs}h ${mins.toString().padStart(2, "0")}m`;
};

const DELAY_STYLES: Record<DelayStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 border border-amber-200",
  APPROVED: "bg-blue-100 text-blue-700 border border-blue-200",
  REJECTED: "bg-red-100 text-red-700 border border-red-200",
};

const DELAY_LABEL: Record<DelayStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

/* ─────────────── summary card ─────────────── */

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
}

function SummaryCard({
  label,
  value,
  icon,
  iconBg,
  valueColor = "text-gray-900",
}: SummaryCardProps) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-shadow cursor-default">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}
      >
        {icon}
      </div>
      <p className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

/* ─────────────── main component ─────────────── */

export default function AttendancePage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  /* fetch */
  const fetchAttendance = useCallback(
    async (authToken: string, silent = false) => {
      try {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        const [summaryRes, recordsRes] = await Promise.all([
          fetch(
            `${API}/api/attendance/my-attendance/summary?month=${selectedMonth}`,
            { headers: { Authorization: `Bearer ${authToken}` } },
          ),
          fetch(`${API}/api/attendance/my-attendance?month=${selectedMonth}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ]);

        if (summaryRes.status === 401 || recordsRes.status === 401) {
          router.push("/");
          return;
        }

        const [summaryData, recordsData] = await Promise.all([
          summaryRes.json(),
          recordsRes.json(),
        ]);

        if (summaryData.success) setSummary(summaryData.data);
        console.log(summaryData.data);
        if (recordsData.success) setRecords(recordsData.data);
        if (silent) toast.success("Attendance refreshed!");
      } catch {
        toast.error("Failed to load attendance data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedMonth, router],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoading(false);
      router.push("/");
      return;
    }
    fetchAttendance(token);
  }, [token, authLoading, fetchAttendance]);

  const handleRefresh = () => {
    if (token) fetchAttendance(token, true);
  };

  /* ─── loading skeleton ─── */
  if (authLoading || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-5 w-40 bg-gray-100 rounded" />
            <div className="h-3 w-56 bg-gray-100 rounded" />
          </div>
          <div className="h-10 w-32 bg-gray-100 rounded-xl" />
        </div>
        <div className="h-32 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  /* ─── render ─── */
  return (
    <div className="space-y-6">
      {/* page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Attendance</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Track your daily check-ins and monthly summary
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            max={new Date().toISOString().slice(0, 7)}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition-colors"
          />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 border rounded-xl px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* mark attendance button */}
      <MarkAttendanceButton onAttendanceChange={handleRefresh} />

      {/* summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <SummaryCard
            label="Working Days"
            value={summary.totalDays}
            icon={<CalendarDays className="w-4 h-4 text-blue-600" />}
            iconBg="bg-blue-50"
          />
          <SummaryCard
            label="Present"
            value={summary.presentDays}
            icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
            iconBg="bg-emerald-50"
            valueColor="text-emerald-700"
          />
          <SummaryCard
            label="Absent"
            value={summary.absentDays}
            icon={<XCircle className="w-4 h-4 text-red-500" />}
            iconBg="bg-red-50"
            valueColor={
              summary.absentDays > 0 ? "text-red-600" : "text-gray-900"
            }
          />
          <SummaryCard
            label="Late Days"
            value={summary.lateDays ?? 0}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
            iconBg="bg-amber-50"
            valueColor={
              (summary.lateDays ?? 0) > 0 ? "text-amber-600" : "text-gray-900"
            }
          />
          <SummaryCard
            label="WFH Days"
            value={summary.wfhDays ?? 0}
            icon={<Home className="w-4 h-4 text-violet-500" />}
            iconBg="bg-violet-50"
          />
        </div>
      )}

      {/* records table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Attendance Records</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedMonth} —{" "}
              <span className="font-medium text-gray-600">
                {records.length}
              </span>{" "}
              {records.length === 1 ? "entry" : "entries"}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-400 tracking-wider">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Check In</th>
                <th className="px-6 py-3">Check Out</th>
                <th className="px-6 py-3">Working Hours</th>
                <th className="px-6 py-3">Mode</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-300 text-sm"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <CalendarDays className="w-8 h-8 text-gray-100" />
                      No records found for{" "}
                      {new Date(selectedMonth + "-01").toLocaleDateString(
                        "en-IN",
                        { month: "long", year: "numeric" },
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const isExpanded = expandedRow === record._id;
                  const workHrs = calcWorkingHours(
                    record.checkInTime,
                    record.checkOutTime,
                  );
                  const isActive = !!record.checkInTime && !record.checkOutTime;

                  return (
                    <React.Fragment key={record._id}>
                      <tr
                        className={`hover:bg-gray-50/70 transition-colors ${record.markedLate
                          ? "cursor-pointer"
                          : "cursor-default"
                          }`}
                        onClick={() => {
                          if (record.markedLate)
                            setExpandedRow(isExpanded ? null : record._id);
                        }}
                      >
                        {/* date */}
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {formatDate(record.date)}
                        </td>

                        {/* check in */}
                        <td className="px-6 py-4">
                          <span className="text-gray-700 tabular-nums">
                            {formatTime(record.checkInTime)}
                          </span>
                        </td>

                        {/* check out */}
                        <td className="px-6 py-4">
                          <span className="text-gray-500 tabular-nums">
                            {record.checkOutTime ? (
                              formatTime(record.checkOutTime)
                            ) : isActive ? (
                              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                Active
                              </span>
                            ) : (
                              "—"
                            )}
                          </span>
                        </td>

                        {/* working hours */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Timer
                              className={`w-3.5 h-3.5 ${isActive
                                ? "text-blue-400 animate-pulse"
                                : "text-gray-300"
                                }`}
                            />
                            <span
                              className={`text-sm font-medium tabular-nums ${isActive ? "text-blue-600" : "text-gray-600"
                                }`}
                            >
                              {workHrs}
                            </span>
                          </div>
                        </td>

                        {/* mode */}
                        <td className="px-6 py-4">
                          {record.workMode ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                              {record.workMode === "WFH" ? (
                                <Home className="w-3.5 h-3.5 text-violet-500" />
                              ) : (
                                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                              )}
                              {record.workMode}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        {/* status badge */}
                        <td className="px-6 py-4">
                          {record.markedLate ? (
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${DELAY_STYLES[record.delayStatus ?? "PENDING"]
                                }`}
                            >
                              Late ·{" "}
                              {DELAY_LABEL[record.delayStatus ?? "PENDING"]}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-semibold">
                              On Time
                            </span>
                          )}
                        </td>

                        {/* expand icon */}
                        <td className="px-4 py-4">
                          {record.markedLate && (
                            <div className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 transition cursor-pointer">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* expanded late detail */}
                      {isExpanded && record.markedLate && (
                        <tr className="bg-amber-50/60 border-l-2 border-amber-300">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="max-w-xl space-y-3">
                              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                Late Check-in Details
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-white rounded-xl border border-amber-100 px-3 py-2.5">
                                  <p className="text-xs text-gray-400 mb-1">
                                    Your Reason
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    {record.delayReason?.trim() || (
                                      <span className="italic text-gray-300">
                                        No reason provided
                                      </span>
                                    )}
                                  </p>
                                </div>

                                <div className="bg-white rounded-xl border border-amber-100 px-3 py-2.5">
                                  <p className="text-xs text-gray-400 mb-1">
                                    Manager Remarks
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    {record.adminRemarks?.trim() || (
                                      <span className="italic text-gray-300">
                                        {record.delayStatus === "PENDING"
                                          ? "Awaiting review"
                                          : "No remarks added"}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {record.delayStatus === "PENDING" && (
                                <p className="text-xs text-amber-600/80">
                                  ⏳ Your late check-in is pending approval from
                                  your manager.
                                </p>
                              )}
                              {record.delayStatus === "APPROVED" && (
                                <p className="text-xs text-blue-600/80">
                                  ✅ Your late check-in has been approved.
                                </p>
                              )}
                              {record.delayStatus === "REJECTED" && (
                                <p className="text-xs text-red-600/80">
                                  ❌ Your late check-in was not approved. This
                                  may affect your attendance record.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* footer */}
        {records.length > 0 && summary && (
          <div className="px-6 py-3 bg-gray-50 border-t flex flex-wrap gap-4 text-xs text-gray-400">
            <span>
              Attendance Rate:{" "}
              <strong className="text-gray-700">
                {summary.totalDays > 0
                  ? Math.round((summary.presentDays / summary.totalDays) * 100)
                  : 0}
                %
              </strong>
            </span>
            <span>
              WFH:{" "}
              <strong className="text-gray-700">{summary.wfhDays ?? 0}</strong>{" "}
              days
            </span>
            <span>
              WFO:{" "}
              <strong className="text-gray-700">{summary.wfoDays ?? 0}</strong>{" "}
              days
            </span>
            <span className="text-amber-500">
              Late: <strong>{summary?.lateDays ?? 0}</strong> day
              {(summary?.lateDays ?? 0) > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
