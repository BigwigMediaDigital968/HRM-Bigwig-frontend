'use client";'
import { useState, useEffect } from "react";
import { useAuth, UserRole } from "@/app/context/AuthContext";
import { useApi } from "@/app/Hooks/useApi";



export default function AddEmployee({ onSuccess, employees, designations, departments, isOpen,
    onClose }: { onSuccess?: () => void; employees: any[], designations: any[], departments: any[], isOpen: boolean, onClose: () => void }) {
    const { token } = useAuth();
    const api = useApi();


    const [email, setEmail] = useState("");
    const [newEmpRole, setNewEmpRole] = useState<UserRole>("EMPLOYEE");
    const [newDesignation, setNewDesignation] = useState("");
    const [newDepartment, setNewDepartment] = useState("");
    const [newReportingManager, setNewReportingManager] = useState("");

 

    const [loading, setLoading] = useState(false);
    const [createdEmployee, setCreatedEmployee] = useState<any>(null);


    /* ── create employee ── */
    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setCreatedEmployee(null);
        try {
            const data = await api("/api/admin/create-employee", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    role: newEmpRole,
                    designation: newDesignation || undefined,
                    department: newDepartment || undefined,
                    reportingManager: newReportingManager || undefined,
                }),
            });
            setCreatedEmployee(data.data);
            setEmail("");
            setNewEmpRole("EMPLOYEE");
            setNewDesignation("");
            setNewDepartment("");
            setNewReportingManager("");
            onSuccess?.();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
                    <h2 className="text-base font-semibold text-gray-900">
                        Add Employee
                    </h2>

                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                        ✕
                    </button>
                </div>

                {/* Existing Content */}
                <div className="p-6">
                    <form onSubmit={handleAddEmployee} className="space-y-4">
                        {/* email */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="employee@company.com"
                                className="mt-1.5 w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* role */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Role
                            </label>
                            <select
                                value={newEmpRole}
                                onChange={(e) =>
                                    setNewEmpRole(e.target.value as UserRole)
                                }
                                className="mt-1.5 w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="EMPLOYEE">Employee</option>
                                <option value="HR">HR</option>
                                <option value="MANAGER">Manager</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>

                        {/* designation */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Designation
                            </label>
                            <select
                                value={newDesignation}
                                onChange={(e) => setNewDesignation(e.target.value)}
                                className="mt-1.5 w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="">— Select —</option>
                                {designations.map((d) => (
                                    <option key={d._id} value={d._id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* department */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Department
                            </label>
                            <select
                                value={newDepartment}
                                onChange={(e) => setNewDepartment(e.target.value)}
                                className="mt-1.5 w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="">— Select —</option>
                                {departments.map((d) => (
                                    <option key={d._id} value={d._id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* reporting manager */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Reporting Manager
                            </label>
                            <select
                                value={newReportingManager}
                                onChange={(e) =>
                                    setNewReportingManager(e.target.value)
                                }
                                className="mt-1.5 w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="">— None —</option>
                                {employees
                                    .filter(
                                        (e) =>
                                            e.role === "MANAGER" ||
                                            e.role === "ADMIN"
                                    )
                                    .map((e) => (
                                        <option key={e._id} value={e._id}>
                                            {e.employeeDetails?.name ||
                                                e.employeeId}{" "}
                                            ({e.role})
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition"
                        >
                            {loading ? "Creating…" : "Create Account"}
                        </button>
                    </form>

                    {createdEmployee && (
                        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm space-y-1">
                            <p className="font-semibold text-emerald-700 mb-2">
                                ✓ Employee created
                            </p>
                            <p className="text-gray-600">
                                <span className="text-gray-400">ID:</span>{" "}
                                {createdEmployee.employeeId}
                            </p>
                            <p className="text-gray-600">
                                <span className="text-gray-400">Email:</span>{" "}
                                {createdEmployee.email}
                            </p>

                            {createdEmployee.designation && (
                                <p className="text-gray-600">
                                    <span className="text-gray-400">
                                        Designation:
                                    </span>{" "}
                                    {createdEmployee.designation}
                                </p>
                            )}

                            {createdEmployee.department && (
                                <p className="text-gray-600">
                                    <span className="text-gray-400">
                                        Department:
                                    </span>{" "}
                                    {createdEmployee.department}
                                </p>
                            )}

                            <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                                <p className="text-xs text-red-500 font-medium mb-0.5">
                                    Temp Password (share once)
                                </p>
                                <p className="font-mono text-red-700 font-semibold">
                                    {createdEmployee.temporaryPassword}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}