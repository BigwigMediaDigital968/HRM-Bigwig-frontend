"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function AdminLeaveManagement() {
  const { token } = useAuth();

  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  /* ================= FETCH ALL LEAVES ================= */

  const fetchLeaves = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leave/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setLeaves(data.data);
    } catch (err: any) {
      toast.error("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchLeaves();
  }, [token]);

  /* ================= APPROVE / REJECT ================= */

  const handleAction = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedLeave) return;

    try {
      setActionLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leave/admin/${selectedLeave._id}/action`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status, remarks }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(`Leave ${status.toLowerCase()} successfully`);
      setModalOpen(false);
      fetchLeaves();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /* ================= APPROVE CANCELLATION ================= */

  const approveCancellation = async (leaveId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leave/admin/${leaveId}/cancel-approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Leave cancellation approved");
      fetchLeaves();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div>Loading leave requests...</div>;

  return (
    <div className="space-y-8">
      {/* ================= TABLE ================= */}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold">Employee</th>
              <th className="px-6 py-4 text-sm font-semibold">Dates</th>
              <th className="px-6 py-4 text-sm font-semibold">Days</th>
              <th className="px-6 py-4 text-sm font-semibold">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {leaves.map((leave) => (
              <tr key={leave._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium">{leave.employee?.employeeId}</p>
                  <p className="text-sm text-gray-500">
                    {leave.employee?.email}
                  </p>
                </td>

                <td className="px-6 py-4 text-sm">
                  {new Date(leave.fromDate).toDateString()} <br />
                  to <br />
                  {new Date(leave.toDate).toDateString()}
                </td>

                <td className="px-6 py-4 font-medium">{leave.totalDays}</td>

                <td className="px-6 py-4">
                  <StatusBadge status={leave.status} />

                  {leave.cancellationStatus === "REQUESTED" && (
                    <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                      Cancel Requested
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 text-right space-x-2">
                  {/* Approve / Reject */}
                  {leave.status === "PENDING" && (
                    <button
                      onClick={() => {
                        setSelectedLeave(leave);
                        setModalOpen(true);
                      }}
                      className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                    >
                      Review
                    </button>
                  )}

                  {/* Approve Cancellation */}
                  {leave.cancellationStatus === "REQUESTED" && (
                    <button
                      onClick={() => approveCancellation(leave._id)}
                      className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                    >
                      Approve Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}

      {modalOpen && selectedLeave && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-8">
            <h3 className="text-lg font-semibold mb-6">Review Leave Request</h3>

            <div className="space-y-4 mb-6 text-sm">
              <p>
                <strong>Employee:</strong> {selectedLeave.employee?.employeeId}
              </p>
              <p>
                <strong>Reason:</strong> {selectedLeave.reason}
              </p>
              <p>
                <strong>Total Days:</strong> {selectedLeave.totalDays}
              </p>
            </div>

            <textarea
              placeholder="Admin remarks (optional)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full border rounded-lg p-3 mb-6"
            />

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg"
              >
                Cancel
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleAction("REJECTED")}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg"
              >
                Reject
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleAction("APPROVED")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= STATUS BADGE ================= */

function StatusBadge({ status }: any) {
  const styles: any = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-200 text-gray-700",
  };

  return (
    <span
      className={`px-3 py-1 text-xs rounded-full font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
