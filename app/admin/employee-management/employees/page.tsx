"use client";

import { useState, useEffect } from "react";
import { useAuth, UserRole } from "@/app/context/AuthContext";
import { PlusCircle } from "lucide-react";

export default function EmployeeManagement() {
  const { token } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [empLoading, setEmpLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<any>(null);
  const [newEmpRole, setNewEmpRole] = useState<UserRole>("EMPLOYEE");

  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  /* ================= FETCH EMPLOYEES ================= */

  const fetchEmployees = async () => {
    if (!token) return;

    try {
      setEmpLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/employees`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setEmployees(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setEmpLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [token]);

  /* ================= CREATE EMPLOYEE ================= */

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreatedEmployee(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/create-employee`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email,
            role: newEmpRole,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setCreatedEmployee(data.data);
      setEmail("");
      setNewEmpRole("EMPLOYEE");

      await fetchEmployees();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= VIEW DETAILS ================= */

  const handleViewDetails = async (employeeId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/employee/${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSelectedEmployee(data.data);
      setModalOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  /* ================= APPROVE / REJECT ================= */

  const handleVerification = async (
    employeeId: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    try {
      setActionLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/employee/${employeeId}/verify`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await fetchEmployees();
      setModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  /* ================= TOGGLE ACTIVE ================= */

  const handleToggleActive = async (
    employeeId: string,
    currentStatus: boolean,
  ) => {
    try {
      setActionLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/employee/${employeeId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isActive: !currentStatus,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await fetchEmployees();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ================= ADD EMPLOYEE ================= */}

      <div className="card">
        <div className="flex items-center space-x-2 mb-6 border-b pb-4">
          <PlusCircle className="text-blue-600" />
          <h3 className="text-lg font-semibold">Add New Employee</h3>
        </div>

        <form
          onSubmit={handleAddEmployee}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="employee@company.com"
            required
          />

          <select
            value={newEmpRole}
            onChange={(e) => setNewEmpRole(e.target.value as UserRole)}
            className="input-field bg-white"
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
          </select>

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>

      {/* ================= EMPLOYEE DIRECTORY ================= */}

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Employee Directory</h3>

        {empLoading ? (
          <p>Loading employees...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{emp.employeeId}</td>
                    <td className="py-3 px-4">{emp.email}</td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                        {emp.role}
                      </span>
                    </td>

                    {/* STATUS LEFT */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-sm font-medium ${
                          emp.isActive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {emp.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-sm font-medium ${
                          emp.verificationStatus === "APPROVED"
                            ? "text-green-600"
                            : emp.verificationStatus === "REJECTED"
                              ? "text-red-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {emp.verificationStatus || "PENDING"}
                      </span>
                    </td>

                    {/* ACTIONS RIGHT */}
                    <td className="py-3 px-4 text-right space-x-4">
                      <button
                        onClick={() => handleViewDetails(emp.employeeId)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View
                      </button>

                      {emp.role !== "ADMIN" && (
                        <button
                          onClick={() =>
                            handleToggleActive(emp.employeeId, emp.isActive)
                          }
                          className={`text-sm hover:underline ${
                            emp.isActive ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {emp.isActive ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
