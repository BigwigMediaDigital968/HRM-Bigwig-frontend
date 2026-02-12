"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function CancelLeavePage() {
  const { token } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leave/my`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setLeaves(data.data);
    } catch (err: any) {
      toast.error("Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchLeaves();
  }, [token]);

  const handleCancelRequest = async (leaveId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leave/${leaveId}/cancel-request`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Cancellation failed");
      }

      toast.success("Cancellation request sent successfully");
      fetchLeaves(); // refresh table
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8">
      <h3 className="text-lg font-semibold mb-6">My Leave Requests</h3>

      <div className="space-y-4">
        {leaves.map((leave) => (
          <div
            key={leave._id}
            className="border rounded-xl p-6 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">
                {new Date(leave.fromDate).toDateString()} -{" "}
                {new Date(leave.toDate).toDateString()}
              </p>
              <p className="text-sm text-gray-500">
                {leave.totalDays} days • {leave.reason}
              </p>
              <StatusBadge status={leave.status} />
            </div>

            {leave.status === "APPROVED" &&
              leave.cancellationStatus === "NONE" && (
                <button
                  onClick={() => handleCancelRequest(leave._id)}
                  className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                >
                  Request Cancel
                </button>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const colors: any = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-200 text-gray-700",
  };

  return (
    <span
      className={`inline-block mt-2 px-3 py-1 text-xs rounded-full font-medium ${colors[status]}`}
    >
      {status}
    </span>
  );
}
