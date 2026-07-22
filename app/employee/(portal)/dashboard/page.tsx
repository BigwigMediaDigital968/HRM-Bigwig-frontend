"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  User,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  Home,
  Briefcase,
  ArrowRight,
  CalendarDays,
  TrendingUp,
  AlertCircle,
  Timer,
} from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

/* ================= TYPES ================= */

interface AttendanceSummary {
  month: string;
  totalDays: number;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays?: number;
  wfhDays?: number;
  wfoDays?: number;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  workMode?: "WFO" | "WFH";
  markedLate?: boolean;
}

interface LeaveBalance {
  totalLeaves: number;
  usedLeaves: number;
  availableLeaves: number;
  negativeLeaves: number;
}

interface LeaveRequest {
  _id: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
}

/* ================= HELPERS ================= */

// Use local date (not UTC) to avoid timezone issues - matches MarkAttendanceButton
const getLocalDateString = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Calculate live working hours
const calcWorkingHours = (checkIn?: string, checkOut?: string): string => {
  if (!checkIn) return "—";
  const start = new Date(checkIn).getTime();
  const end = checkOut ? new Date(checkOut).getTime() : Date.now();
  const diffMs = end - start;
  if (diffMs < 0) return "—";
  const totalMins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hrs}h ${mins.toString().padStart(2, "0")}m`;
};

const formatTime = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ================= COMPONENTS ================= */


interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
  subtext?: string;
  linkText?: string;
  linkHref?: string;
  cardHref?: string
  onLinkClick?: () => void;
}

export function StatsCard({
  label,
  value,
  icon,
  iconBg,
  valueColor = "text-gray-900",
  subtext,
  linkText,
  linkHref,
  cardHref,
  onLinkClick,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow flex flex-col justify-between min-h-35">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{value}</p>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>{icon}</div>
      </div>

      {linkText && (
        <div className="pt-2 border-t border-gray-50 flex items-center">
          {linkHref ? (
            <Link
              href={linkHref}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              {linkText} →
            </Link>
          ) : (
            <button
              onClick={onLinkClick}
              type="button"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
            >
              {linkText} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function LeaveStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
    APPROVED: "bg-green-100 text-green-700 border-green-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
    CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full font-medium border ${styles[status] || styles.PENDING}`}
    >
      {status}
    </span>
  );
}

/* ================= MAIN DASHBOARD ================= */

export default function EmployeeDashboard() {
  const { user, loading, token } = useAuth();
  const router = useRouter();

  const [hasSubmittedDetails, setHasSubmittedDetails] = useState(false);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [fetching, setFetching] = useState(true);
  const [liveWorkingTime, setLiveWorkingTime] = useState<string>("—");

  // Use local date to match MarkAttendanceButton
  const localToday = getLocalDateString();
  const currentMonth = new Date().toISOString().slice(0, 7);

  /* ================= LIVE WORKING TIME ================= */
  useEffect(() => {
    if (!todayAttendance?.checkInTime || todayAttendance?.checkOutTime) {
      setLiveWorkingTime("—");
      return;
    }

    const tick = () => {
      setLiveWorkingTime(calcWorkingHours(todayAttendance.checkInTime));
    };
    tick();
    const id = setInterval(tick, 30000); // Update every 30 seconds
    return () => clearInterval(id);
  }, [todayAttendance]);

  /* ================= AUTH CHECK ================= */

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYEE")) {
      router.replace("/employee/login");
    }
  }, [user, loading, router]);

  /* ================= CHECK IF DETAILS EXIST ================= */

  useEffect(() => {
    const checkDetails = async () => {
      if (!token) return;

      try {
        const res = await fetch(`${API}/api/employee/details/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setHasSubmittedDetails(true);
        } else {
          setHasSubmittedDetails(false);
        }
      } catch (error) {
        console.error("Error checking employee details:", error);
      }
    };

    checkDetails();
  }, [token]);

  /* ================= FETCH DASHBOARD DATA ================= */

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    setFetching(true);
    try {
      const [summaryRes, balanceRes, leavesRes, attendanceRes] = await Promise.all([
        fetch(`${API}/api/attendance/my-attendance/summary?month=${currentMonth}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/leave/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/leave/my`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/attendance/my-attendance?month=${currentMonth}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [summaryData, balanceData, leavesData, attendanceData] = await Promise.all([
        summaryRes.json(),
        balanceRes.json(),
        leavesRes.json(),
        attendanceRes.json(),
      ]);

      if (summaryData.success) setSummary(summaryData.data);
      if (balanceData.success) setBalance(balanceData.data);
      if (leavesData.success) setLeaves(leavesData.data || []);


      // console.log("attendanceData", attendanceData, localToday);

      // Find today's attendance using local date
      if (attendanceData.success && attendanceData.data) {
        const todayRecord = attendanceData.data.find(
          (r: AttendanceRecord) => {
            const recordDate = new Date(r.date).toLocaleDateString("en-CA");
            return recordDate === localToday;
          }
        );
        if (todayRecord) {
          setTodayAttendance(todayRecord);
          // Set initial working time
          if (!todayRecord.checkOutTime) {
            setLiveWorkingTime(calcWorkingHours(todayRecord.checkInTime));
          } else {
            setLiveWorkingTime(calcWorkingHours(todayRecord.checkInTime, todayRecord.checkOutTime));
          }
        } else {
          setTodayAttendance(null);
          setLiveWorkingTime("—");
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setFetching(false);
    }
  }, [token, currentMonth, localToday]);

  useEffect(() => {
    if (token && hasSubmittedDetails) {
      fetchDashboardData();
    }
  }, [token, hasSubmittedDetails, fetchDashboardData]);

  /* ================= STATUS LOGIC ================= */

  const isApproved = hasSubmittedDetails && user?.verificationStatus === "APPROVED";
  const isRejected = hasSubmittedDetails && user?.verificationStatus === "REJECTED";
  const isPending = hasSubmittedDetails && user?.verificationStatus === "PENDING";

  const pendingLeavesCount = leaves.filter((l) => l.status === "PENDING").length;
  const attendanceRate = summary
    ? Math.round((summary.presentDays / summary.totalWorkingDays) * 100) || 0
    : 0;

  if (loading || !user || user.role !== "EMPLOYEE") {
    return null;
  }

  /* ================= RENDER ================= */

  return (
    <div className="space-y-6">
      {/* Verification Status Messages */}
      {isPending && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg flex items-center gap-2">
          <Clock size={20} />
          Your submitted details are under verification by admin.
        </div>
      )}

      {isRejected && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          Your submitted details were rejected. Please update and resubmit.
        </div>
      )}

      {/* Quick Stats Row */}
      {isApproved && !fetching && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Attendance Rate"
            value={`${attendanceRate}%`}
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-50"
            valueColor={attendanceRate >= 90 ? "text-green-600" : attendanceRate >= 70 ? "text-yellow-600" : "text-red-600"}
            subtext={`${summary?.presentDays || 0}/${summary?.totalWorkingDays || 0} days`}
          />
          <StatsCard
            label="Leave Balance"
            value={balance?.availableLeaves ?? 0}
            icon={<Calendar className="w-5 h-5 text-violet-600" />}
            iconBg="bg-violet-50"
            valueColor={(balance?.availableLeaves ?? 0) > 0 ? "text-gray-900" : "text-red-600"}
            subtext="days available"
          />
          <StatsCard
            label="Pending Leaves"
            value={pendingLeavesCount}
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-50"
            valueColor={pendingLeavesCount > 0 ? "text-amber-600" : "text-gray-900"}
            subtext="requests"
          />
          <StatsCard
            label="Today's Attendance"
            value={todayAttendance?.checkInTime
              ? todayAttendance.checkOutTime
                ? "Completed"
                : liveWorkingTime
              : "—"}
            icon={
              todayAttendance?.checkInTime ? (
                todayAttendance.checkOutTime ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Timer className="w-5 h-5 text-blue-600" />
                )
              ) : (
                <Clock className="w-5 h-5 text-red-500" />
              )
            }
            iconBg={todayAttendance?.checkInTime
              ? todayAttendance.checkOutTime
                ? "bg-green-50"
                : "bg-blue-50"
              : "bg-red-50"}
            valueColor={todayAttendance?.checkInTime
              ? todayAttendance.checkOutTime
                ? "text-green-600"
                : "text-blue-600"
              : "text-red-500"}
            subtext={todayAttendance?.checkInTime
              ? todayAttendance.checkOutTime
                ? `Checked out at ${formatTime(todayAttendance.checkOutTime)}`
                : `Checked in at ${formatTime(todayAttendance.checkInTime)}`
              : "Not checked in yet"}
            linkText={!todayAttendance?.checkInTime ? "Mark Attendance" : "View Details"}
            linkHref="/employee/attendance"
          />
        </div>
      )}

      {/* Main Content Grid */}
      {isApproved && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Attendance & Leave Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Attendance Summary */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                  This Month's Attendance
                </h3>
                <span className="text-sm text-gray-500">
                  {new Date(currentMonth + "-01").toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              {fetching ? (
                <div className="animate-pulse grid grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {summary?.totalWorkingDays ?? 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Working Days</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">
                      {summary?.presentDays ?? 0}
                    </p>
                    <p className="text-xs text-green-600 mt-1">Present</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-700">
                      {summary?.absentDays ?? 0}
                    </p>
                    <p className="text-xs text-red-600 mt-1">Absent</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-amber-700">
                      {summary?.lateDays ?? 0}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">Late</p>
                  </div>
                </div>
              )}

              {/* Work Mode Stats */}
              {!fetching && (summary?.wfhDays || summary?.wfoDays) && (
                <div className="mt-4 pt-4 border-t flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-violet-500" />
                    <span className="text-gray-600">WFH:</span>
                    <span className="font-medium">{summary?.wfhDays ?? 0} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600">WFO:</span>
                    <span className="font-medium">{summary?.wfoDays ?? 0} days</span>
                  </div>
                </div>
              )}

              <Link
                href="/employee/attendance"
                className="mt-4 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                View Details <ArrowRight size={16} />
              </Link>
            </div>

            {/* Recent Leave Requests */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-violet-600" />
                  Recent Leave Requests
                </h3>
                <Link
                  href="/employee/leaves/cancel"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View All
                </Link>
              </div>

              {fetching ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg" />
                  ))}
                </div>
              ) : leaves.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">
                  No leave requests yet
                </p>
              ) : (
                <div className="space-y-3">
                  {leaves.slice(0, 5).map((leave) => (
                    <div
                      key={leave._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(leave.fromDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                          {leave.fromDate !== leave.toDate &&
                            ` - ${new Date(leave.toDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {leave.totalDays} day{leave.totalDays > 1 ? "s" : ""} • {leave.reason}
                        </p>
                      </div>
                      <LeaveStatusBadge status={leave.status} />
                    </div>
                  ))}
                </div>
              )}

              <Link
                href="/employee/leaves/apply"
                className="mt-4 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                Apply for Leave <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Right Column: Leave Balance & Quick Actions */}
          <div className="space-y-6">
            {/* Leave Balance Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-600" />
                Leave Balance
              </h3>

              {fetching ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-600">Total Allocated</span>
                    <span className="font-semibold text-gray-900">
                      {balance?.totalLeaves ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm text-gray-600">Used</span>
                    <span className="font-semibold text-red-700">
                      {balance?.usedLeaves ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-600">Available</span>
                    <span className="font-semibold text-green-700">
                      {balance?.availableLeaves ?? 0}
                    </span>
                  </div>
                  {(balance?.negativeLeaves ?? 0) > 0 && (
                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                      <span className="text-sm text-gray-600">Negative</span>
                      <span className="font-semibold text-amber-700">
                        {balance?.negativeLeaves}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <Link
                href="/employee/leaves/apply"
                className="mt-4 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                Apply Leave <ArrowRight size={16} />
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/employee/attendance"
                  className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Mark Attendance</p>
                    <p className="text-xs text-gray-500">Check in/out today</p>
                  </div>
                </Link>

                <Link
                  href="/employee/leaves/apply"
                  className="flex items-center gap-3 p-3 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Apply Leave</p>
                    <p className="text-xs text-gray-500">Request time off</p>
                  </div>
                </Link>

                <Link
                  href="/employee/profile"
                  className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">View Profile</p>
                    <p className="text-xs text-gray-500">Your details</p>
                  </div>
                </Link>

                <Link
                  href="/employee/leaves/cancel"
                  className="flex items-center gap-3 p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">My Leaves</p>
                    <p className="text-xs text-gray-500">View requests</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Profile Completion Reminder */}
            {!isApproved && (
              <Link
                href="/employee/details"
                className="block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl p-6 text-white transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Complete Your Profile</p>
                    <p className="text-sm text-blue-100 mt-1">
                      Update personal info and upload documents
                    </p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Show Profile Completion for non-approved users */}
      {!isApproved && (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              What would you like to do?
            </h2>
            <p className="text-gray-500 mt-2">
              Manage your profile and documents easily.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {!isApproved && (
              <Link
                href="/employee/details"
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition p-10 text-center"
              >
                <FileText size={40} className="mx-auto text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold">Complete Details</h3>
                <p className="text-gray-500 mt-2 text-sm">
                  Update personal info and upload documents.
                </p>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
