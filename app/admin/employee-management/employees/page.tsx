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
    // if (!token) return;

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
    if (token) {
      fetchEmployees();
    }
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/employee/${employeeId}/toggle-status`,
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
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Page Description Only (No Duplicate Heading) */}
      <div className="mb-5">
        <p className="text-sm text-gray-500">
          Manage employees, verification and activation status.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ================= LEFT: EMPLOYEE DIRECTORY ================= */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Employee Directory
            </h3>
            <span className="text-sm text-gray-500">
              Total: {employees.length}
            </span>
          </div>

          {empLoading ? (
            <div className="py-10 text-center text-gray-500">
              Loading employees...
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Verification
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right w-40">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {employees.map((emp) => (
                    <tr
                      key={emp._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {emp.employeeId}
                          </span>
                          <span className="text-sm text-gray-500">
                            {emp.email}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {emp.role}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            emp.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {emp.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            emp.verificationStatus === "APPROVED"
                              ? "bg-green-100 text-green-700"
                              : emp.verificationStatus === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {emp.verificationStatus || "PENDING"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleViewDetails(emp.employeeId)}
                            className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                          >
                            View
                          </button>

                          {emp.role !== "ADMIN" && (
                            <button
                              onClick={() =>
                                handleToggleActive(emp.employeeId, emp.isActive)
                              }
                              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                                emp.isActive
                                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                                  : "bg-green-50 text-green-600 hover:bg-green-100"
                              }`}
                            >
                              {emp.isActive ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ================= RIGHT: ADD EMPLOYEE CARD ================= */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Add New Employee
          </h3>

          <form onSubmit={handleAddEmployee} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Employee Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="employee@company.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select
                value={newEmpRole}
                onChange={(e) => setNewEmpRole(e.target.value as UserRole)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          {createdEmployee && (
            <div className="mt-6 bg-green-50 border border-green-200 p-4 rounded-lg text-sm">
              <p className="font-semibold text-green-700">Employee Created</p>
              <p>ID: {createdEmployee.employeeId}</p>
              <p>Email: {createdEmployee.email}</p>
              <p className="text-red-600 font-medium mt-1">
                Temp Password: {createdEmployee.temporaryPassword}
              </p>
            </div>
          )}
        </div>
      </div>
      {modalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl p-8 relative animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Employee Details
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition"
              >
                ✕
              </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm text-gray-500">Employee ID</p>
                <p className="font-medium">{selectedEmployee.employeeId}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{selectedEmployee.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium">{selectedEmployee.role}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Active Status</p>
                <p className="font-medium">
                  {selectedEmployee.isActive ? "Active" : "Inactive"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Verification</p>
                <p className="font-medium">
                  {selectedEmployee.verificationStatus || "PENDING"}
                </p>
              </div>
            </div>

            {/* Divider */}
            <hr className="my-6" />

            {/* Employee Submitted Details */}
            {selectedEmployee.employeeDetails ? (
              <div>
                <h4 className="text-lg font-semibold mb-4">
                  Submitted Details
                </h4>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">
                      {selectedEmployee.employeeDetails.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="font-medium">
                      {selectedEmployee.employeeDetails.contact}
                    </p>
                  </div>
                </div>

                {/* Documents */}
                <div className="grid grid-cols-3 gap-6">
                  {selectedEmployee.employeeDetails.photo && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Photo</p>
                      <img
                        src={selectedEmployee.employeeDetails.photo.url}
                        className="rounded-lg border w-full h-40 object-cover"
                      />
                    </div>
                  )}

                  {selectedEmployee.employeeDetails.aadhaar && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Aadhaar</p>
                      <img
                        src={selectedEmployee.employeeDetails.aadhaar.url}
                        className="rounded-lg border w-full h-40 object-cover"
                      />
                    </div>
                  )}

                  {selectedEmployee.employeeDetails.pan && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">PAN</p>
                      <img
                        src={selectedEmployee.employeeDetails.pan.url}
                        className="rounded-lg border w-full h-40 object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">
                No details submitted yet.
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center mt-8 border-t pt-6">
              {/* Left Side: Verification Status */}
              <div>
                <span className="text-sm text-gray-500 mr-2">
                  Current Status:
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedEmployee.verificationStatus === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : selectedEmployee.verificationStatus === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {selectedEmployee.verificationStatus || "PENDING"}
                </span>
              </div>

              {/* Right Side: Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-sm"
                >
                  Close
                </button>

                {/* Show verify/reject only if not already approved */}
                {selectedEmployee.verificationStatus !== "APPROVED" && (
                  <>
                    <button
                      onClick={() =>
                        handleVerification(
                          selectedEmployee.employeeId,
                          "REJECTED",
                        )
                      }
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading ? "Processing..." : "Reject"}
                    </button>

                    <button
                      onClick={() =>
                        handleVerification(
                          selectedEmployee.employeeId,
                          "APPROVED",
                        )
                      }
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading ? "Processing..." : "Approve"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
