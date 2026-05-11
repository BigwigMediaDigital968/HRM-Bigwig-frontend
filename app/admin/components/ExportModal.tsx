
import { useState } from "react";
import {
    Download,
    FileSpreadsheet,
    X,
    Eye,
    Loader2,
    ChevronRight,
} from "lucide-react";

import * as XLSX from "xlsx";
import { useQuery } from "@tanstack/react-query";
import { getWorkingDaysBetween } from "@/app/utils/date";


const API = process.env.NEXT_PUBLIC_API_URL;


/* export modal types */
interface PreviewSummaryRow {
    employeeId: string;
    name: string;
    email: string;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    wfoDays: number;
    wfhDays: number;
}

interface PreviewDailyRow {
    employeeId: string;
    name: string;
    date: string;
    status: string;
    workMode: string;
    checkIn: string;
    checkOut: string;
    hoursWorked: string;
    markedLate: boolean;
    delayStatus: string;
}/* export modal types */
interface PreviewSummaryRow {
    employeeId: string;
    name: string;
    email: string;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    wfoDays: number;
    wfhDays: number;
}

interface PreviewDailyRow {
    employeeId: string;
    name: string;
    date: string;
    status: string;
    workMode: string;
    checkIn: string;
    checkOut: string;
    hoursWorked: string;
    markedLate: boolean;
    delayStatus: string;
}

type PreviewResponse = {
    summary: PreviewSummaryRow[];
    dailyPreview: PreviewDailyRow[];
    totalRecords: number;
};

const defaultFrom = () => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
};

const defaultTo = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 0);
    return d.toISOString().slice(0, 10);
};

export default function ExportModal({ token, onClose, employees }: { token: string; onClose: () => void; employees?: any }) {
    const [scope, setScope] = useState<"all" | "specific">("all");
    const [empId, setEmpId] = useState("");
    const [fromDate, setFromDate] = useState(defaultFrom());
    const [toDate, setToDate] = useState(defaultTo());
    const [activeSheet, setActiveSheet] = useState<"summary" | "daily">("summary");
    const [downloading, setDownloading] = useState(false);

    //console.log("date range", fromDate, toDate, getWorkingDaysBetween(fromDate, toDate))

    const buildParams = () => {
        const p = new URLSearchParams();
        p.set("employeeId", scope === "all" ? "all" : empId.trim());
        p.set("from", fromDate);
        p.set("to", toDate);
        return p.toString();
    };


    const {
        data: previewData,
        isLoading: previewing,
        error: previewError,
        refetch: handlePreview,
    } = useQuery<PreviewResponse>({
        queryKey: ["attendance-preview", buildParams()],
        queryFn: async () => {
            const res = await fetch(
                `${API}/api/attendance/export/preview?${buildParams()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();
            console.log(data)

            if (!data.success) {
                throw new Error(data.message || "Preview failed");
            }

            return data.data;
        },
    });

    const onPreview = async () => {
        try {
            await handlePreview();
        } catch (err) {
            console.error(err);
        }
    };


    const handleDownload = () => {
        if (!previewData) return; // must preview first

        const wb = XLSX.utils.book_new();

        if (empId) {
            const employee = previewData.summary?.[0];

            const singleEmployeeRows = [
                ["Employee Details"],
                [],
                ["Employee ID", employee?.employeeId || "—"],
                ["Name", employee?.name || "—"],
                ["Email", employee?.email || "—"],
                ["Total Days", employee?.totalDays || 0],
                ["Present", employee?.presentDays || 0],
                ["Absent", employee?.absentDays || 0],
                ["Late Arrivals", employee?.lateDays || 0],
                ["WFO Days", employee?.wfoDays || 0],
                ["WFH Days", employee?.wfhDays || 0],
                [
                    "Attendance %",
                    employee?.totalDays > 0
                        ? `${Math.round(
                            (employee.presentDays / employee.totalDays) * 100,
                        )}%`
                        : "0%",
                ],
                [],
                [],
                [
                    "Date",
                    "Status",
                    "Work Mode",
                    "Check-in",
                    "Check-out",
                    "Hours Worked",
                    "Marked Late",
                    "Delay Status",
                ],

                ...previewData.dailyPreview.map((r) => [
                    r.date,
                    r.status,
                    r.workMode,
                    r.checkIn,
                    r.checkOut,
                    r.hoursWorked,
                    r.markedLate ? "Yes" : "No",
                    r.delayStatus,
                ]),
            ];

            const ws = XLSX.utils.aoa_to_sheet(singleEmployeeRows);

            XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

            XLSX.writeFile(wb, `attendance_${fromDate}_to_${toDate}.xlsx`);

            return;
        }

        // Sheet 1 — Summary
        const summaryRows = previewData.summary.map((e) => ({
            "Employee ID": e.employeeId,
            "Name": e.name,
            "Email": e.email,
            "Total Days": e.totalDays,
            "Present": e.presentDays,
            "Absent": e.absentDays,
            "Late Arrivals": e.lateDays,
            "WFO Days": e.wfoDays,
            "WFH Days": e.wfhDays,
            "Attendance %": e.totalDays > 0
                ? `${Math.round((e.presentDays / e.totalDays) * 100)}%`
                : "0%",
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Summary");

        // Sheet 2 — Daily Log (all rows, not just preview slice)
        const dailyRows = previewData.dailyPreview.map((r) => ({
            "Employee ID": r.employeeId,
            "Name": r.name,
            "Date": r.date,
            "Status": r.status,
            "Work Mode": r.workMode,
            "Check-in": r.checkIn,
            "Check-out": r.checkOut,
            "Hours Worked": r.hoursWorked,
            "Marked Late": r.markedLate ? "Yes" : "No",
            "Delay Status": r.delayStatus,
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dailyRows), "Daily Log");

        XLSX.writeFile(wb, `attendance_${fromDate}_to_${toDate}.xlsx`);
    };

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
        >
            <div
                className="bg-white rounded-2xl max-w-5xl max-h-[90vh] shadow-2xl w-full flex flex-col"
            >
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 text-sm">Export Attendance Report</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Configure, preview, then download as .xlsx</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 cursor-pointer hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1">
                    {/* ── Config Section ── */}
                    <div className="px-6 pt-5 pb-4 border-b bg-gray-50/60">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Configuration</p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Scope */}
                            <div>
                                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Employee Scope</label>
                                <div className="flex gap-2">
                                    {(["all", "specific"] as const).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setScope(s)}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm border transition font-medium ${scope === s
                                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                                                }`}
                                        >
                                            {s === "all" ? "All Employees" : "Specific"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Employee ID (conditional) */}
                            {/* <div className={scope === "specific" ? "" : "opacity-40 pointer-events-none"}>
                                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Employee ID</label>
                                <input
                                    type="text"
                                    value={empId}
                                    onChange={(e) => setEmpId(e.target.value)}
                                    placeholder="e.g. EMP-001"
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                            </div> */}
                            <EmployeeSearchSelect empId={empId} setEmpId={setEmpId} employees={employees} scope={scope}/>

                            {/* Date range */}
                            <div>
                                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Date Range</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    />
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={onPreview}
                                disabled={previewing || (scope === "specific" && !empId.trim())}
                                className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                            >
                                {previewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                                {previewing ? "Loading Preview…" : "Preview"}
                            </button>

                            <button
                                onClick={handleDownload}
                                disabled={downloading || (scope === "specific" && !empId.trim())}
                                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                {downloading ? "Downloading…" : "Download .xlsx"}
                            </button>
                        </div>
                    </div>

                    {/* ── Preview Area ── */}
                    <div className="px-6 py-5">
                        {previewError && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                                {previewError.message}
                            </div>
                        )}

                        {!previewData && !previewing && !previewError && (
                            <div className="flex flex-col items-center justify-center py-14 text-gray-300">
                                <FileSpreadsheet className="w-12 h-12 mb-3" />
                                <p className="text-sm font-medium text-gray-400">Configure and click Preview</p>
                                <p className="text-xs text-gray-300 mt-1">Both sheets will appear here before you download</p>
                            </div>
                        )}

                        {previewing && (
                            <div className="flex items-center justify-center py-14 gap-3 text-gray-400">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                <span className="text-sm">Building preview…</span>
                            </div>
                        )}

                        {previewData && (
                            <div className="space-y-4">
                                {/* Stats bar */}
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { label: "Employees", value: previewData.summary.length, color: "blue" },
                                        { label: "Total Records", value: previewData.totalRecords, color: "gray" },
                                        { label: "Working Days", value: getWorkingDaysBetween(fromDate, toDate) },
                                        {
                                            label: "Total Present",
                                            value: previewData.summary.reduce((a, e) => a + e.presentDays, 0),
                                            color: "green",
                                        },
                                        {
                                            label: "Total Absent",
                                            value: previewData.summary.reduce((a, e) => a + e.absentDays, 0),
                                            color: "red",
                                        },
                                        {
                                            label: "Late Arrivals",
                                            value: previewData.summary.reduce((a, e) => a + e.lateDays, 0),
                                            color: "yellow",
                                        },
                                    ].map((s) => (
                                        <div
                                            key={s.label}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-${s.color}-50 border border-${s.color}-100`}
                                        >
                                            <span className={`text-base font-bold text-${s.color}-600`}>{s.value}</span>
                                            <span className={`text-xs text-${s.color}-500`}>{s.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Sheet Tabs */}
                                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                                    {(["summary", "daily"] as const).map((sheet) => (
                                        <button
                                            key={sheet}
                                            onClick={() => setActiveSheet(sheet)}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${activeSheet === sheet
                                                ? "bg-white shadow-sm text-gray-900"
                                                : "text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            {sheet === "summary" ? "📊 Summary Sheet" : "📋 Daily Log Sheet"}
                                        </button>
                                    ))}
                                </div>

                                {/* Sheet Preview */}
                                <div className="rounded-xl border overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2.5 border-b flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-500">
                                            {activeSheet === "summary" ? "Summary Sheet Preview" : `Daily Log Preview (first ${previewData.dailyPreview.length} of ${previewData.totalRecords} rows)`}
                                        </span>
                                        <span className="text-[10px] text-gray-300 italic">Scroll →</span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        {activeSheet === "summary" ? (
                                            <table className="w-full text-xs text-left whitespace-nowrap">
                                                <thead className="bg-[#1E3A5F] text-white">
                                                    <tr>
                                                        {["Employee ID", "Name", "Email", "Total Days", "Present", "Absent", "Late", "WFO", "WFH", "Attendance %"].map((h) => (
                                                            <th key={h} className="px-4 py-2.5 font-semibold tracking-wide">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {previewData.summary.map((row, i) => {
                                                        const pct = row.totalDays > 0 ? Math.round((row.presentDays / row.totalDays) * 100) : 0;
                                                        return (
                                                            <tr key={row.employeeId} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                                <td className="px-4 py-2 font-medium text-gray-700">{row.employeeId}</td>
                                                                <td className="px-4 py-2 text-gray-700">{row.name}</td>
                                                                <td className="px-4 py-2 text-gray-400">{row.email}</td>
                                                                <td className="px-4 py-2 text-center text-gray-600">{row.totalDays}</td>
                                                                <td className="px-4 py-2 text-center font-semibold text-green-600">{row.presentDays}</td>
                                                                <td className="px-4 py-2 text-center font-semibold text-red-500">{row.absentDays}</td>
                                                                <td className="px-4 py-2 text-center font-semibold text-yellow-600">{row.lateDays}</td>
                                                                <td className="px-4 py-2 text-center text-blue-600">{row.wfoDays}</td>
                                                                <td className="px-4 py-2 text-center text-purple-600">{row.wfhDays}</td>
                                                                <td className="px-4 py-2 text-center">
                                                                    <span className={`font-bold ${pct >= 80 ? "text-green-600" : pct >= 60 ? "text-yellow-600" : "text-red-500"}`}>
                                                                        {pct}%
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <table className="w-full text-xs text-left whitespace-nowrap">
                                                <thead className="bg-[#1E3A5F] text-white">
                                                    <tr>
                                                        {["Emp ID", "Name", "Date", "Status", "Mode", "Check-in", "Check-out", "Hours", "Late", "Delay"].map((h) => (
                                                            <th key={h} className="px-4 py-2.5 font-semibold tracking-wide">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {previewData.dailyPreview.map((row, i) => (
                                                        <tr
                                                            key={i}
                                                            className={
                                                                row.status === "ABSENT" ? "bg-yellow-50"
                                                                    : row.markedLate ? "bg-red-50"
                                                                        : row.workMode === "WFH" ? "bg-blue-50"
                                                                            : i % 2 === 0 ? "bg-white"
                                                                                : "bg-gray-50"
                                                            }
                                                        >
                                                            <td className="px-4 py-2 font-medium text-gray-700">{row.employeeId}</td>
                                                            <td className="px-4 py-2 text-gray-700">{row.name}</td>
                                                            <td className="px-4 py-2 text-gray-600">{row.date}</td>
                                                            <td className={`px-4 py-2 font-semibold ${row.status === "PRESENT" ? "text-green-600" : "text-red-500"}`}>
                                                                {row.status}
                                                            </td>
                                                            <td className="px-4 py-2 text-gray-500">{row.workMode}</td>
                                                            <td className="px-4 py-2 text-gray-600">{row.checkIn}</td>
                                                            <td className="px-4 py-2 text-gray-600">{row.checkOut}</td>
                                                            <td className="px-4 py-2 text-gray-600">{row.hoursWorked}</td>
                                                            <td className={`px-4 py-2 font-medium ${row.markedLate ? "text-red-500" : "text-gray-400"}`}>
                                                                {row.markedLate ? "Yes" : "No"}
                                                            </td>
                                                            <td className="px-4 py-2 text-gray-500">{row.delayStatus}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal footer */}
                <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex items-center justify-between shrink-0">
                    <p className="text-xs text-gray-400">
                        Export includes <strong className="text-gray-600">2 sheets</strong>: Summary + Daily Log
                    </p>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="cursor-pointer px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition">
                            Cancel
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={downloading || (scope === "specific" && !empId.trim())}
                            className="cursor-pointer flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            {downloading ? "Downloading…" : "Download .xlsx"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const EmployeeSearchSelect = ({ employees, empId, setEmpId, scope }:{employees:any; empId:any; setEmpId:any; scope:any}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Filter employees based on name or ID
  const filteredEmployees = employees.filter((emp:any) => {
    const name = emp.employeeDetails?.name?.toLowerCase() || "";
    const id = emp.employeeId?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return (name.includes(search) || id.includes(search)) && emp.verificationStatus == "APPROVED";
  });

  const handleSelect = (id:any) => {
    setEmpId(id);
    setSearchTerm(""); // Clear search after selection
    setIsOpen(false);
  };

  return (
    <div className={`relative ${scope === "specific" ? "" : "opacity-40 pointer-events-none"}`}>
      <label className="text-xs text-gray-500 mb-1.5 block font-medium">
        Select Employee
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchTerm : empId}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search by name or ID..."
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />

        {/* Dropdown Menu */}
        {isOpen && (
          <ul className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-height-60 overflow-auto max-h-48">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp:any) => (
                <li
                  key={emp._id}
                  onClick={() => handleSelect(emp.employeeId)}
                  className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                >
                  <span className="font-medium text-gray-900">
                    {emp.employeeDetails?.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {emp.employeeId}
                  </span>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-gray-500">No employees found</li>
            )}
          </ul>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
