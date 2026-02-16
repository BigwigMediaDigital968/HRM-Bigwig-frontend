"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import MarkAttendanceButton from "./MarkAttendanceButton";

const API = process.env.NEXT_PUBLIC_API_URL;

/* =========================
   Types
========================= */

type DelayStatus = "PENDING" | "APPROVED" | "REJECTED";

interface AttendanceRecord {
  _id: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  workMode?: "WFO" | "WFH";
  markedLate: boolean;
  delayStatus?: DelayStatus;
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

/* =========================
   Component
========================= */

export default function AttendancePage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  /* =========================
     Fetch Attendance
  ========================= */

  useEffect(() => {
    if (authLoading) return; // wait until auth is restored

    if (!token) {
      setLoading(false);
      router.push("/"); // or login page
      return;
    }

    fetchAttendance(token);
  }, [token, authLoading]);

  const fetchAttendance = async (authToken: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, recordsRes] = await Promise.all([
        fetch(
          `${API}/api/attendance/my-attendance/summary?month=${currentMonth}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          },
        ),
        fetch(`${API}/api/attendance/my-attendance?month=${currentMonth}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      // Handle expired token
      if (summaryRes.status === 401 || recordsRes.status === 401) {
        router.push("/");
        return;
      }

      const summaryData = await summaryRes.json();
      const recordsData = await recordsRes.json();

      if (summaryData.success) {
        setSummary(summaryData.data as AttendanceSummary);
      }

      if (recordsData.success) {
        setRecords(recordsData.data as AttendanceRecord[]);
      }
    } catch (err) {
      console.error("Attendance fetch failed:", err);
      setError("Failed to load attendance data.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Helpers
  ========================= */

  const formatTime = (date?: string): string => {
    if (!date) return "-";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* =========================
     UI States
  ========================= */

  if (authLoading || loading) {
    return <p className="text-sm text-gray-500">Loading attendance...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  /* =========================
     Render
  ========================= */

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        View your attendance summary and daily records.
      </p>

      <MarkAttendanceButton />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <div className="flex justify-between">
              <CalendarDays className="text-blue-600" />
              <span className="text-xs text-gray-400">{summary.month}</span>
            </div>
            <h3 className="text-2xl font-bold mt-4">{summary.totalDays}</h3>
            <p className="text-sm text-gray-500">Working Days</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <div className="flex justify-between">
              <CheckCircle className="text-green-600" />
              <span className="text-xs text-gray-400">Present</span>
            </div>
            <h3 className="text-2xl font-bold mt-4">{summary.presentDays}</h3>
            <p className="text-sm text-gray-500">Days Present</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <div className="flex justify-between">
              <XCircle className="text-red-500" />
              <span className="text-xs text-gray-400">Absent</span>
            </div>
            <h3 className="text-2xl font-bold mt-4">{summary.absentDays}</h3>
            <p className="text-sm text-gray-500">Days Absent</p>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            This Month Records
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Check In</th>
                <th className="px-6 py-3">Check Out</th>
                <th className="px-6 py-3">Work Mode</th>
                <th className="px-6 py-3">Late Status</th>
              </tr>
            </thead>

            <tbody className="divide-y text-sm">
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-400"
                  >
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {formatTime(record.checkInTime)}
                    </td>
                    <td className="px-6 py-4">
                      {formatTime(record.checkOutTime)}
                    </td>
                    <td className="px-6 py-4">{record.workMode ?? "-"}</td>
                    <td className="px-6 py-4">
                      {record.markedLate ? (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          {record.delayStatus}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          On Time
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
