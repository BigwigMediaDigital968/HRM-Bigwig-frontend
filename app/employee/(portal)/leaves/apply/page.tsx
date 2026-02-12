"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function ApplyLeavePage() {
  const { token } = useAuth();

  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
  });

  /* ================= FETCH LEAVE BALANCE ================= */

  const fetchBalance = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leave/balance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setBalance(data.data);
    } catch (err: any) {
      toast.error("Failed to load leave balance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBalance();
  }, [token]);

  /* ================= HANDLE SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leave/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Leave request submitted successfully");
      setFormData({ fromDate: "", toDate: "", reason: "" });
      fetchBalance();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      {/* ================= LEAVE BALANCE CARDS ================= */}

      <div className="grid md:grid-cols-4 gap-6">
        <BalanceCard title="Total Leaves" value={balance.totalLeaves} />
        <BalanceCard title="Used Leaves" value={balance.usedLeaves} />
        <BalanceCard title="Available Leaves" value={balance.availableLeaves} />
        <BalanceCard title="Negative Leaves" value={balance.negativeLeaves} />
      </div>

      {/* ================= FORM ================= */}

      <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-3xl">
        <h3 className="text-lg font-semibold mb-6">Apply for Leave</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <input
              type="date"
              value={formData.fromDate}
              onChange={(e) =>
                setFormData({ ...formData, fromDate: e.target.value })
              }
              required
              className="input-field"
            />

            <input
              type="date"
              value={formData.toDate}
              onChange={(e) =>
                setFormData({ ...formData, toDate: e.target.value })
              }
              required
              className="input-field"
            />
          </div>

          <textarea
            placeholder="Reason for leave"
            value={formData.reason}
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
            required
            className="input-field h-32"
          />

          <button
            type="submit"
            disabled={submitting}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg transition"
          >
            {submitting ? "Submitting..." : "Submit Leave Request"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ================= BALANCE CARD COMPONENT ================= */

function BalanceCard({ title, value }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-semibold mt-2 text-slate-900">{value}</p>
    </div>
  );
}
