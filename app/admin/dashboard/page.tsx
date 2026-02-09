"use client";

import { useState } from "react";
import { useAuth, UserRole } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { LogOut, PlusCircle, Users, LayoutDashboard } from "lucide-react";

export default function AdminDashboard() {
  const { user, logout, addEmployee, employees, token } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<any>(null);

  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpRole, setNewEmpRole] = useState<UserRole>("EMPLOYEE");

  if (!user || user.role !== "ADMIN") {
    // Basic route protection
    if (typeof window !== "undefined") router.push("/admin/login");
    return null;
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/create-employee`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // IMPORTANT
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
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:block">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold">Bigwig HRM</h1>
          <p className="text-slate-400 text-sm">Admin Panel</p>
        </div>
        <nav className="p-4 space-y-2">
          <a
            href="#"
            className="flex items-center space-x-3 px-4 py-3 bg-slate-800 rounded-lg text-white"
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </a>
          <div className="pt-8 border-t border-slate-800 mt-4">
            <button
              onClick={logout}
              className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white w-full transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-6 flex justify-between items-center sticky top-0 z-10">
          <div className="md:hidden">
            {/* Mobile menu trigger placeholder */}
            <span className="font-bold text-lg">Bigwig HRM</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user.name}</span>
            <button
              onClick={logout}
              className="md:hidden p-2 text-gray-500 hover:text-red-600"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
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
          </div>

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
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>

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

          {/* Recent Employees List */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Employee Directory
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-sm font-medium text-gray-500">
                      ID
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-gray-500">
                      Name
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
                      key={emp.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-900">{emp.id}</td>
                      <td className="py-3 px-4 text-gray-900">{emp.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${emp.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}
                        >
                          {emp.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-400 text-sm">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
