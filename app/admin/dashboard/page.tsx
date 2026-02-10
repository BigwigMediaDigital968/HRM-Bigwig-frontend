"use client";

import { useAuth } from "@/app/context/AuthContext";
import { Users } from "lucide-react";

export default function AdminDashboard() {
  const { employees } = useAuth();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Employees</p>
            <p className="text-2xl font-bold">
              {employees.filter((e) => e.role === "EMPLOYEE").length}
            </p>
          </div>
        </div>
        {/* Add more stats here if needed */}
        {/* <div className="card flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Admins</p>
            <p className="text-2xl font-bold">
              {employees.filter((e) => e.role === "ADMIN").length}
            </p>
          </div>
        </div> */}
      </div>
    </div>
  );
}
