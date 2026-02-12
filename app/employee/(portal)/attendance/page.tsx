"use client";

import { CalendarDays, CheckCircle, XCircle } from "lucide-react";

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      {/* Description Only */}
      <p className="text-sm text-gray-500">
        View your attendance summary and daily records.
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <CalendarDays className="text-blue-600" />
            <span className="text-xs text-gray-400">This Month</span>
          </div>
          <h3 className="text-2xl font-bold mt-4">22</h3>
          <p className="text-sm text-gray-500">Working Days</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <CheckCircle className="text-green-600" />
            <span className="text-xs text-gray-400">Present</span>
          </div>
          <h3 className="text-2xl font-bold mt-4">20</h3>
          <p className="text-sm text-gray-500">Days Present</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <XCircle className="text-red-500" />
            <span className="text-xs text-gray-400">Absent</span>
          </div>
          <h3 className="text-2xl font-bold mt-4">2</h3>
          <p className="text-sm text-gray-500">Days Absent</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Attendance
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Check In</th>
                <th className="px-6 py-3">Check Out</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {[
                {
                  date: "12 Feb 2026",
                  in: "09:05 AM",
                  out: "06:02 PM",
                  status: "Present",
                },
                {
                  date: "11 Feb 2026",
                  in: "09:10 AM",
                  out: "06:00 PM",
                  status: "Present",
                },
                { date: "10 Feb 2026", in: "-", out: "-", status: "Absent" },
              ].map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{row.date}</td>
                  <td className="px-6 py-4">{row.in}</td>
                  <td className="px-6 py-4">{row.out}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        row.status === "Present"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
