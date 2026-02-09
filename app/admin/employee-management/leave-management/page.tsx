"use client";

import { Calendar } from "lucide-react";

export default function LeaveManagement() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="card text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
            <Calendar size={48} />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Leave Management
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Manage employee leave requests, approvals, and balances here.
          This module is coming soon.
        </p>
      </div>
    </div>
  );
}
