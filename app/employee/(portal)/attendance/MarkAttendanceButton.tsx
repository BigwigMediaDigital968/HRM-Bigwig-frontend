"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  Clock,
  MapPin,
  Home,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Timer,
  Wifi,
} from "lucide-react";
import { toast } from "react-toastify";

const API = process.env.NEXT_PUBLIC_API_URL;

interface TodayRecord {
  _id?: string;
  date?: string;
  checkInTime?: string;
  checkOutTime?: string;
  markedLate?: boolean;
  workMode?: "WFO" | "WFH";
  delayStatus?: "PENDING" | "APPROVED" | "REJECTED";
}

interface MarkAttendanceButtonProps {
  onAttendanceChange?: () => void;
}

/* ─────────────── helpers ─────────────── */

const formatTime = (iso?: string) => {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

const DELAY_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING: {
    label: "Pending Review",
    cls: "bg-amber-100 text-amber-700 border border-amber-200",
  },
  APPROVED: {
    label: "Approved",
    cls: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  REJECTED: {
    label: "Rejected",
    cls: "bg-red-100 text-red-700 border border-red-200",
  },
};

/* ─────────────── component ─────────────── */

export default function MarkAttendanceButton({
  onAttendanceChange,
}: MarkAttendanceButtonProps) {
  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [mode, setMode] = useState<"WFO" | "WFH">("WFO");
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [delayReason, setDelayReason] = useState("");
  const [isLate, setIsLate] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [todayRecord, setTodayRecord] = useState<TodayRecord | null>(null);
  const [liveWorkingTime, setLiveWorkingTime] = useState("—");

  // Use local date (not UTC) to avoid IST timezone off-by-one
  const localToday = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const isToday = selectedDate === localToday;

  /* live clock — ticks every 30s while checked in */
  useEffect(() => {
    if (!todayRecord?.checkInTime || todayRecord?.checkOutTime) return;
    const tick = () =>
      setLiveWorkingTime(calcWorkingHours(todayRecord.checkInTime));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [todayRecord]);

  /* late detector */
  useEffect(() => {
    const checkLate = () => {
      const now = new Date();
      const lateTime = new Date();
      lateTime.setHours(10, 45, 0, 0);
      setIsLate(now > lateTime);
    };
    checkLate();
    const id = setInterval(checkLate, 60000);
    return () => clearInterval(id);
  }, []);

  /* fetch record for selected date */
  const fetchStatus = useCallback(async () => {
    if (!token) return;
    setFetchingStatus(true);
    try {
      const month = selectedDate.slice(0, 7);
      const res = await fetch(
        `${API}/api/attendance/my-attendance?month=${month}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (data.success) {
        const entry = (
          data.data as Array<TodayRecord & { date?: string }>
        ).find((r) => {
          const d = new Date(r.date ?? "");
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}` === selectedDate;
        });
        if (entry) {
          setAlreadyMarked(true);
          setCheckoutDone(!!entry.checkOutTime);
          setTodayRecord(entry);
          setLiveWorkingTime(
            calcWorkingHours(entry.checkInTime, entry.checkOutTime),
          );
        } else {
          setAlreadyMarked(false);
          setCheckoutDone(false);
          setTodayRecord(null);
          setLiveWorkingTime("—");
        }
      }
    } catch {
      /* silent */
    } finally {
      setFetchingStatus(false);
    }
  }, [token, selectedDate]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /* mark attendance */
  const handleMark = () => {
    if (!token) return toast.error("Unauthorized. Please log in.");
    if (!selectedDate) return toast.warning("Please select a date.");
    if (isLate && isToday && !delayReason.trim())
      return toast.warning("Please provide a reason for late check-in.");

    if (mode === "WFO") {
      navigator.geolocation.getCurrentPosition(
        async (pos) =>
          submitAttendance(
            token,
            selectedDate,
            pos.coords.latitude,
            pos.coords.longitude,
          ),
        () =>
          toast.error(
            "Location permission denied. Please allow location access.",
          ),
      );
    } else {
      submitAttendance(token, selectedDate);
    }
  };

  const submitAttendance = async (
    authToken: string,
    date: string,
    lat?: number,
    lng?: number,
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/attendance/mark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date,
          workMode: mode,
          latitude: lat,
          longitude: lng,
          delayReason: isLate && isToday ? delayReason : "",
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        toast.error("Session expired. Please log in again.");
        return;
      }
      if (data.success) {
        toast.success("✅ Attendance marked successfully!");
        await fetchStatus();
        onAttendanceChange?.();
      } else {
        toast.error(data.message || "Failed to mark attendance.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* checkout */
  const handleCheckout = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/attendance/checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("👋 Checked out successfully!");
        await fetchStatus();
        onAttendanceChange?.();
      } else {
        toast.error(data.message || "Checkout failed.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── skeleton ─── */
  if (fetchingStatus) {
    return (
      <div className="bg-white rounded-2xl border shadow-sm p-5 animate-pulse space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 bg-gray-100 rounded" />
            <div className="h-2.5 w-20 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-50 rounded-xl" />
          ))}
        </div>
        <div className="h-10 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  /* ─── already checked in card ─── */
  if (alreadyMarked) {
    const workingTime = todayRecord?.checkOutTime
      ? calcWorkingHours(todayRecord.checkInTime, todayRecord.checkOutTime)
      : liveWorkingTime;

    return (
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {/* status accent bar */}
        <div
          className={`h-1 w-full ${
            checkoutDone
              ? "bg-gradient-to-r from-slate-300 to-slate-400"
              : "bg-gradient-to-r from-emerald-400 to-teal-500"
          }`}
        />

        <div className="p-5 space-y-4">
          {/* title row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  checkoutDone ? "bg-slate-100" : "bg-emerald-50"
                }`}
              >
                <CheckCircle2
                  className={`w-5 h-5 ${
                    checkoutDone ? "text-slate-400" : "text-emerald-600"
                  }`}
                />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm leading-tight">
                  {checkoutDone ? "Work Day Complete" : "Currently Working"}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {todayRecord?.workMode === "WFH" ? (
                    <Home className="w-3 h-3 text-violet-500" />
                  ) : (
                    <MapPin className="w-3 h-3 text-blue-500" />
                  )}
                  <span className="text-xs text-gray-400">
                    {todayRecord?.workMode ?? "—"}
                  </span>
                  <span className="text-gray-200 text-xs">·</span>
                  {todayRecord?.markedLate ? (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        DELAY_BADGE[todayRecord.delayStatus ?? "PENDING"].cls
                      }`}
                    >
                      Late —{" "}
                      {DELAY_BADGE[todayRecord.delayStatus ?? "PENDING"].label}
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      On Time
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!checkoutDone && (
              <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Active
              </div>
            )}
          </div>

          {/* time stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-400">Check In</p>
              </div>
              <p className="text-sm font-bold text-gray-800 tabular-nums">
                {formatTime(todayRecord?.checkInTime)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1">
                <LogOut className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-400">Check Out</p>
              </div>
              <p className="text-sm font-bold text-gray-800 tabular-nums">
                {checkoutDone ? formatTime(todayRecord?.checkOutTime) : "—"}
              </p>
            </div>

            <div
              className={`rounded-xl p-3 space-y-1 ${
                checkoutDone ? "bg-gray-50" : "bg-blue-50"
              }`}
            >
              <div className="flex items-center gap-1">
                <Timer
                  className={`w-3 h-3 ${
                    checkoutDone ? "text-gray-400" : "text-blue-500"
                  }`}
                />
                <p
                  className={`text-xs ${
                    checkoutDone ? "text-gray-400" : "text-blue-500"
                  }`}
                >
                  {checkoutDone ? "Total" : "Working"}
                </p>
              </div>
              <p
                className={`text-sm font-bold tabular-nums ${
                  checkoutDone ? "text-gray-800" : "text-blue-700"
                }`}
              >
                {workingTime}
              </p>
            </div>
          </div>

          {/* date label */}
          <p className="text-xs text-gray-300 text-center">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>

          {/* checkout CTA — show whenever checked in but not yet checked out */}
          {!checkoutDone && (
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Check Out Now
                </>
              )}
            </button>
          )}

          {/* completed state */}
          {checkoutDone && (
            <div className="flex items-center justify-center gap-2 py-1 text-sm text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
              Work day complete · See you tomorrow!
            </div>
          )}

          {/* disabled check-in indicator */}
          <button
            disabled
            className="w-full py-2 rounded-xl text-xs font-medium bg-gray-50 text-gray-300 cursor-not-allowed border border-dashed border-gray-200 select-none"
          >
            ✓ Attendance already recorded for this day
          </button>
        </div>
      </div>
    );
  }

  /* ─── mark form ─── */
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />

      <div className="p-5 space-y-4">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                Mark Attendance
              </p>
              <p className="text-xs text-gray-400">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {isLate && isToday ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" />
              Late Check-in
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              On Time
            </div>
          )}
        </div>

        {/* inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* date */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              max={localToday}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border rounded-xl px-3 py-2.5 text-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition-colors"
            />
          </div>

          {/* work mode */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Work Mode
            </label>
            <div className="flex rounded-xl border overflow-hidden bg-gray-50 text-sm h-[42px]">
              <button
                onClick={() => setMode("WFO")}
                className={`flex-1 flex items-center justify-center gap-1.5 transition-all cursor-pointer font-medium ${
                  mode === "WFO"
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                WFO
              </button>
              <button
                onClick={() => setMode("WFH")}
                className={`flex-1 flex items-center justify-center gap-1.5 transition-all cursor-pointer font-medium ${
                  mode === "WFH"
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                WFH
              </button>
            </div>
          </div>
        </div>

        {/* location hint */}
        {mode === "WFO" && (
          <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            Your GPS location will be recorded at check-in
          </div>
        )}

        {/* late reason */}
        {isLate && isToday && (
          <div className="space-y-1.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <label className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Reason for late check-in
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              placeholder="e.g. Heavy traffic, Doctor appointment, Power outage…"
              rows={2}
              className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none cursor-text focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-gray-300 transition-colors"
            />
            <p className="text-xs text-amber-600/70">
              This will be sent to your manager for approval
            </p>
          </div>
        )}

        {/* submit */}
        <button
          onClick={handleMark}
          disabled={loading || alreadyMarked}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            alreadyMarked
              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
              : loading
                ? "bg-blue-400 text-white cursor-wait"
                : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] cursor-pointer shadow-sm shadow-blue-200"
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Marking Attendance…
            </>
          ) : mode === "WFO" ? (
            <>
              <MapPin className="w-4 h-4" />
              Mark Attendance — Work From Office
            </>
          ) : (
            <>
              <Home className="w-4 h-4" />
              Mark Attendance — Work From Home
            </>
          )}
        </button>
      </div>
    </div>
  );
}
