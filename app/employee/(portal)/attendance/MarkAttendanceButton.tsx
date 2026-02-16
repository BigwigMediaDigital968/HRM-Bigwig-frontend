"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function MarkAttendanceButton() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"WFO" | "WFH">("WFO");

  // Default to today
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const handleMark = () => {
    if (!token) {
      alert("Unauthorized");
      return;
    }

    if (!selectedDate) {
      alert("Please select a date");
      return;
    }

    if (mode === "WFO") {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await markAttendance(
            token,
            selectedDate,
            position.coords.latitude,
            position.coords.longitude,
          );
        },
        () => {
          alert("Location permission denied");
        },
      );
    } else {
      markAttendance(token, selectedDate);
    }
  };

  const markAttendance = async (
    authToken: string,
    date: string,
    lat?: number,
    lng?: number,
  ) => {
    try {
      setLoading(true);

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
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        alert("Session expired. Please login again.");
        return;
      }

      if (data.success) {
        alert("Attendance marked successfully!");
        window.location.reload();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl shadow-sm border">
      {/* Date Picker */}
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="border rounded-lg px-3 py-2"
      />

      {/* Work Mode */}
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as "WFO" | "WFH")}
        className="border rounded-lg px-3 py-2"
      >
        <option value="WFO">Work From Office</option>
        <option value="WFH">Work From Home</option>
      </select>

      {/* Button */}
      <button
        onClick={handleMark}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        {loading ? "Marking..." : "Mark Attendance"}
      </button>
    </div>
  );
}
