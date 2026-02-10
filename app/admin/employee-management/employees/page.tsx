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

  // 🔹 Fetch all employees (ADMIN)
  const fetchEmployees = async () => {
    if (!token) {
      setEmpLoading(false);
      return;
    }

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

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch employees");
      }

      setEmployees(data.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setEmpLoading(false);
    }
  };

  // 🔹 Initial fetch
  useEffect(() => {
    fetchEmployees();
  }, [token]);

  // 🔹 Add employee
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

      if (!res.ok) {
        throw new Error(data.message || "Failed to create employee");
      }

      setCreatedEmployee(data.data);

      // Reset form
      setEmail("");
      setNewEmpRole("EMPLOYEE");

      // ✅ IMPORTANT: refetch full employee list
      await fetchEmployees();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Add Employee Form */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6 border-b border-gray-100 pb-4">
          <PlusCircle className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Add New Employee
          </h3>
        </div>

        <form
          onSubmit={handleAddEmployee}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="employee@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={newEmpRole}
              onChange={(e) => setNewEmpRole(e.target.value as UserRole)}
              className="input-field bg-white"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>

      {/* Success Message */}
      {createdEmployee && (
        <div className="mt-6 bg-green-50 border border-green-200 p-4 rounded-lg">
          <h4 className="font-semibold text-green-700 mb-2">
            Employee Created Successfully
          </h4>
          <p>
            <strong>Employee ID:</strong> {createdEmployee.employeeId}
          </p>
          <p>
            <strong>Email:</strong> {createdEmployee.email}
          </p>
          <p className="text-red-600 font-semibold">
            Temporary Password: {createdEmployee.temporaryPassword}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Ask employee to change password on first login.
          </p>
        </div>
      )}

      {/* Employee Directory */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Employee Directory
        </h3>

        {empLoading ? (
          <p className="text-gray-500">Loading employees...</p>
        ) : employees.length === 0 ? (
          <p className="text-gray-500">No employees found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-sm font-medium text-gray-500">
                    Employee ID
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-500">
                    Email
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-500">
                    Role
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {employees.map((emp) => (
                  <tr
                    key={emp._id} // internal only
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-900">
                      {emp.employeeId}
                    </td>

                    <td className="py-3 px-4 text-gray-900">{emp.email}</td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          emp.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {emp.role}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-sm ${
                          emp.isActive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {emp.isActive ? "Active" : "Inactive"}
                      </span>
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
