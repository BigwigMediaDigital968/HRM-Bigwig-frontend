"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import PasswordManager from "./PasswordManager";
import AddEmployee from "../components/AddEmployee";
import { useApi } from "@/app/Hooks/useApi";
import { ChevronDown, FileText } from "lucide-react";

/* ─────────────────────────── types ─────────────────────────── */
interface EmployeeDetailsRecord {
  name?: string;
  contact?: string;
  photo?: { url: string };
  aadhaar?: { url: string };
  pan?: { url: string };
}

interface Employee {
  _id: string;
  employeeId: string;
  email: string;
  role: string;
  isActive: boolean;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  designation?: { _id?: string; name?: string; title?: string } | null;
  department?: { _id?: string; name?: string; title?: string } | null;
  reportingManager?: {
    _id?: string;
    employeeId?: string;
    email?: string;
    employeeDetails?: { name?: string } | null;
    details?: { name?: string } | null;
  } | null;
  employeeDetails?: EmployeeDetailsRecord | null;
  details?: EmployeeDetailsRecord | null;
}

interface RefData {
  _id: string;
  name: string;
}

interface DesignationRef {
  _id: string;
  title: string;
}

const normalizeEmployee = (employee: Partial<Employee> | null | undefined): Employee => {
  if (!employee) return {} as Employee;

  const details = employee.employeeDetails ?? employee.details ?? null;

  return {
    ...employee,
    employeeDetails: details,
    designation: employee.designation
      ? {
          ...employee.designation,
          name: employee.designation.name ?? employee.designation.title ?? "",
        }
      : null,
    department: employee.department
      ? {
          ...employee.department,
          name: employee.department.name ?? employee.department.title ?? "",
        }
      : null,
    reportingManager: employee.reportingManager
      ? {
          ...employee.reportingManager,
          employeeDetails:
            employee.reportingManager.employeeDetails ??
            employee.reportingManager.details ??
            null,
        }
      : null,
  } as Employee;
};

/* ─────────────────────────── helpers ─────────────────────────── */
const STATUS_STYLES: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  REJECTED: "bg-red-50 text-red-600 ring-1 ring-red-200",
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
};

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  HR: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  MANAGER: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  EMPLOYEE: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${className}`}>
      {label}
    </span>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="flex text-sm">
      <span className="w-28 font-medium text-gray-400">
        {label}:
      </span>
      <span className="font-medium text-gray-800">
        {value || "—"}
      </span>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════ */
export default function EmployeeManagement() {
  const { token } = useAuth();
  const api = useApi();

  /* ── state ── */
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(true);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [addModalOpen, setAddModalOpen] = useState(false);


  const [designations, setDesignations] = useState<DesignationRef[]>([]);
  const [departments, setDepartments] = useState<RefData[]>([]);


  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    role: "",
    designation: "",
    department: "",
    reportingManager: "",
  });

  const [dropdowns, setDropdowns] = useState({
    department: false,
    info: false,
    documents: false,
    passwordLoading: false,
  });

  /* ── derived ── */
  const filtered = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      emp.employeeId.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.employeeDetails?.name?.toLowerCase().includes(q) ||
      emp.designation?.name?.toLowerCase().includes(q) ||
      emp.department?.name?.toLowerCase().includes(q);
    const matchesRole = filterRole === "ALL" || emp.role === filterRole;
    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "ACTIVE" ? emp.isActive : !emp.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });


  const fetchEmployees = useCallback(async () => {
    try {
      setEmpLoading(true);
      const data = await api("/api/admin/employees");
      const normalizedEmployees = (data?.data ?? []).map(normalizeEmployee);
      setEmployees(normalizedEmployees);
    } catch (e) {
      console.error(e);
    } finally {
      setEmpLoading(false);
    }
  }, [api]);

  const fetchRefData = useCallback(async () => {
    try {
      const [desData, depData] = await Promise.all([
        api("/api/admin/designations"),
        api("/api/admin/departments"),
      ]);
      setDesignations(desData.data ?? []);
      setDepartments(depData.data ?? []);
    } catch (e) {
      console.error(e);
    }
  }, [api]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const loadData = async () => {
      try {
        await Promise.all([fetchEmployees(), fetchRefData()]);
      } finally {
        if (!cancelled) {
          setEmpLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [token, fetchEmployees, fetchRefData]);



  /* ── view details ── */
  const handleViewDetails = async (employeeId: string) => {
    try {
      const data = await api(`/api/admin/employee/${employeeId}`);
      const rawEmployee = data?.data?.employee ?? data?.data ?? data;
      const normalizedEmployee = normalizeEmployee(rawEmployee);

      setSelectedEmployee(normalizedEmployee);
      setEditForm({
        role: rawEmployee.role || "",
        designation: rawEmployee.designation?._id || "",
        department: rawEmployee.department?._id || "",
        reportingManager: rawEmployee.reportingManager?._id || "",
      });
      setModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateAssignment = async () => {
    if (!selectedEmployee) return;

    try {
      setActionLoading(true);
      // console.log("Updating assignment with", editForm);

      await api(
        `/api/admin/employee/${selectedEmployee.employeeId}/assignment`,
        {
          method: "PUT",
          body: JSON.stringify(editForm),
        }
      );

      const updated = await api(
        `/api/admin/employee/${selectedEmployee.employeeId}`
      );
      const rawUpdated = updated?.data?.employee ?? updated?.data ?? updated;

      setSelectedEmployee(normalizeEmployee(rawUpdated));

      await fetchEmployees();

      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  /* ── verify ── */
  const handleVerification = async (employeeId: string, status: "APPROVED" | "REJECTED") => {
    try {
      setActionLoading(true);
      await api(`/api/admin/employee/${employeeId}/verify`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await fetchEmployees();
      setModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  /* ── toggle active ── */
  const handleToggleActive = async (employeeId: string, currentStatus: boolean) => {
    try {
      setActionLoading(true);
      await api(`/api/admin/employee/${employeeId}/toggle-status`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      await fetchEmployees();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  /* ── update password ── */
  const handleUpdatePassword = async (newPassword: string) => {
    if (!selectedEmployee) return;
    try {
      setPasswordLoading(true);
      await api(`/api/admin/employee/${selectedEmployee.employeeId}/update-password`, {
        method: "PUT",
        body: JSON.stringify({ password: newPassword }),
      });
      await fetchEmployees();
      setModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setPasswordLoading(false);
    }
  };

  // console.log("selectedEmployee", selectedEmployee);
  /* ═══════════════════════════ render ═══════════════════════════ */
  return (
    <>
      <AddEmployee onSuccess={fetchEmployees} employees={employees} designations={designations} departments={departments} isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <div className="max-w-screen-xl mx-auto px-3 sm:px-5 py-6 space-y-6">

        {/* ── summary strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: employees.length, color: "bg-slate-50 border-slate-200" },
            { label: "Active", value: employees.filter(e => e.isActive).length, color: "bg-emerald-50 border-emerald-200" },
            { label: "Pending", value: employees.filter(e => e.verificationStatus === "PENDING").length, color: "bg-amber-50 border-amber-200" },
            { label: "Approved", value: employees.filter(e => e.verificationStatus === "APPROVED").length, color: "bg-sky-50 border-sky-200" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border px-4 py-3 ${color}`}>
              <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
              <p className="text-2xl font-semibold text-gray-800">{value}</p>
            </div>
          ))}
        </div>

        {/* ── main grid ── */}
        <div className=" gap-6 items-start">

          {/* ════════ DIRECTORY ════════ */}
          <div className=" bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* header + filters */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Employee Directory</h2>
                  <span className="text-xs text-gray-400">{filtered.length} of {employees.length}</span>
                </div>
                <div>
                  <button
                    onClick={() => setAddModalOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Employee
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* search */}
                <div className="relative flex-1 min-w-[160px]">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, email, ID…"
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* role filter */}
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {["ALL", "EMPLOYEE", "HR", "MANAGER", "ADMIN"].map(r => (
                    <option key={r} value={r}>{r === "ALL" ? "All roles" : r}</option>
                  ))}
                </select>

                {/* status filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {["ALL", "ACTIVE", "INACTIVE"].map(s => (
                    <option key={s} value={s}>{s === "ALL" ? "All statuses" : s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* table */}
            {empLoading ? (
              <div className="py-16 text-center text-gray-400 text-sm">Loading employees…</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">No employees match your filters.</div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      <th className="px-5 py-3 text-left">Employee</th>
                      <th className="px-5 py-3 text-left">Role</th>
                      <th className="px-5 py-3 text-left">Department</th>
                      <th className="px-5 py-3 text-left">Designation</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((emp) => (
                      <tr key={emp._id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-gray-900">{emp.employeeDetails?.name || emp.email || "—"}</p>
                          <p className="text-xs text-gray-400">{emp.employeeId} · {emp.email}</p>
                        </td>

                        <td className="px-5 py-3.5">
                          <Badge label={emp.role} className={ROLE_STYLES[emp.role] ?? ROLE_STYLES.EMPLOYEE} />

                        </td>
                        <td className="px-5 py-3.5">

                          {
                            emp.department?.name ? (
                              <Badge label={emp.department.name} className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )
                          }
                        </td>

                        <td className="px-5 py-3.5">
                          {emp.designation?.title || emp.designation?.name ? (
                            <Badge
                              label={emp.designation.title ?? emp.designation.name ?? ""}
                              className="bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                            />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-1">
                            <Badge
                              label={emp.isActive ? "Active" : "Inactive"}
                              className={emp.isActive ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-600 ring-1 ring-red-200"}
                            />
                            <Badge
                              label={emp.verificationStatus ?? "PENDING"}
                              className={STATUS_STYLES[emp.verificationStatus] ?? STATUS_STYLES.PENDING}
                            />
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewDetails(emp.employeeId)}
                              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition"
                            >
                              View
                            </button>
                            {emp.role !== "ADMIN" && (
                              <button
                                onClick={() => handleToggleActive(emp.employeeId, emp.isActive)}
                                disabled={actionLoading}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition disabled:opacity-40 ${emp.isActive
                                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
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
        </div>

        {/* ════════════════ DETAIL MODAL ════════════════ */}
        {modalOpen && selectedEmployee && (
          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center px-4 py-10 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
          >
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">

              {/* modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900">Employee Details</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedEmployee.employeeId}</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400"
                >
                  ✕
                </button>
              </div>

              <div className="px-6 py-5 space-y-6">

                {/* status badges row */}
                <div className="flex flex-wrap gap-2">
                  <Badge label={selectedEmployee.role} className={ROLE_STYLES[selectedEmployee.role] ?? ROLE_STYLES.EMPLOYEE} />
                  <Badge
                    label={selectedEmployee.isActive ? "Active" : "Inactive"}
                    className={selectedEmployee.isActive ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-600 ring-1 ring-red-200"}
                  />
                  <Badge
                    label={selectedEmployee.verificationStatus ?? "PENDING"}
                    className={STATUS_STYLES[selectedEmployee.verificationStatus] ?? STATUS_STYLES.PENDING}
                  />
                </div>

                {/* core info grid */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">

                  <div className="flex flex-col gap-4">
                    <InfoRow label="Email" value={selectedEmployee.email} />
                    <InfoRow label="Full Name" value={selectedEmployee.employeeDetails?.name} />
                    <InfoRow label="Contact" value={selectedEmployee.employeeDetails?.contact} />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                  <button
                    onClick={() =>
                      setDropdowns((prev) => ({
                        ...prev,
                        department: !prev.department,
                      }))
                    }
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        Designation & Department
                      </p>
                      <p className="text-xs text-gray-500">
                        Role, designation, department & reporting manager
                      </p>
                    </div>

                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${dropdowns.department ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {dropdowns.department && (
                    <div className="border-t border-gray-200 p-4">


                      {!isEditing ? (
                        <div className="flex flex-col gap-4">
                          <InfoRow label="Role" value={selectedEmployee.role} />
                          <InfoRow
                            label="Designation"
                            value={selectedEmployee.designation?.title ?? selectedEmployee.designation?.name}
                          />
                          <InfoRow
                            label="Department"
                            value={selectedEmployee.department?.name ?? selectedEmployee.department?.title}
                          />
                          <InfoRow
                            label="Reporting Manager"
                            value={
                              selectedEmployee.reportingManager
                                ? selectedEmployee.reportingManager.employeeDetails?.name ||
                                  selectedEmployee.reportingManager.details?.name ||
                                  selectedEmployee.reportingManager.employeeId
                                : undefined
                            }
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Your existing Role / Department / Designation / Manager fields */}
                          {/* Role */} <div>
                            <label className="block text-sm font-medium mb-1"> Role </label>
                            <select value={editForm.role} onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value, }))} className="w-full border rounded-lg px-3 py-2" >
                              <option value="EMPLOYEE">Employee</option>
                              <option value="HR">HR</option>
                              <option value="MANAGER">Manager</option>
                              <option value="ADMIN">Admin</option>
                            </select>

                          </div> {/* Department */}
                          <div>
                            <label className="block text-sm font-medium mb-1"> Department </label>
                            <select value={editForm.department} onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value, }))} className="w-full border rounded-lg px-3 py-2" >
                              <option value="">Select Department</option>
                              {departments.map((dept) => (<option key={dept._id} value={dept._id}> {dept.name} </option>))}
                            </select>
                          </div>
                          {/* Designation */}
                          <div>
                            <label className="block text-sm font-medium mb-1"> Designation </label>
                            <select value={editForm.designation} onChange={(e) => setEditForm((prev) => ({ ...prev, designation: e.target.value, }))} className="w-full border rounded-lg px-3 py-2" >
                              <option value="">Select Designation</option>
                              {designations.map((designation) => (<option key={designation._id} value={designation._id} > {designation.title} </option>))}
                            </select>
                          </div>
                          {/* Reporting Manager */} <div>
                            <label className="block text-sm font-medium mb-1"> Reporting Manager </label>
                            <select value={editForm.reportingManager} onChange={(e) => setEditForm((prev) => ({ ...prev, reportingManager: e.target.value, }))} className="w-full border rounded-lg px-3 py-2" >
                              <option value="">Select Manager</option>
                              {employees.filter((e) => e._id !== selectedEmployee._id).map((emp) => (<option key={emp._id} value={emp._id}> {emp.employeeDetails?.name || emp.email} </option>))}
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end mt-4">
                        {!isEditing ? (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Edit Assignment
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setIsEditing(false)}
                              className="px-4 py-2 text-sm border rounded-lg"
                            >
                              Cancel
                            </button>

                            <button
                              onClick={handleUpdateAssignment}
                              disabled={actionLoading}
                              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg"
                            >
                              Save Changes
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* documents */}
                {selectedEmployee.employeeDetails && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                    <button
                      onClick={() =>
                        setDropdowns((prev) => ({
                          ...prev,
                          documents: !prev.documents,
                        }))
                      }
                      className="w-full flex items-center justify-between rounded-t-xl border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>

                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-900">
                            Documents
                          </p>
                          <p className="text-xs text-gray-500">
                            Aadhaar, PAN & profile photo
                          </p>
                        </div>
                      </div>

                      <ChevronDown
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${dropdowns.documents ? "rotate-180" : ""
                          }`}
                      />
                    </button>
                    {
                      dropdowns.documents && (
                        <div className="grid grid-cols-3 gap-3 p-4">
                          {(["photo", "aadhaar", "pan"] as const).map((doc) => {
                            const item = selectedEmployee.employeeDetails?.[doc];
                            return item ? (
                              <div key={doc}>
                                <p className="text-xs text-gray-400 mb-1.5 capitalize">{doc}</p>
                                <Image
                                  src={item.url}
                                  alt={doc}
                                  width={400}
                                  height={144}
                                  unoptimized
                                  className="w-full h-36 object-cover rounded-xl border border-gray-200"
                                />
                              </div>
                            ) : null;
                          })}
                        </div>
                      )
                    }
                  </div>
                )}

                {/* password manager */}
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Password</p>
                  <PasswordManager
                    selectedEmployee={selectedEmployee}
                    onSave={handleUpdatePassword}
                    isLoading={passwordLoading}
                  />
                </div>
              </div>

              {/* modal footer */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition"
                >
                  Close
                </button>

                {selectedEmployee.verificationStatus !== "APPROVED" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerification(selectedEmployee.employeeId, "REJECTED")}
                      disabled={actionLoading}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-40"
                    >
                      {actionLoading ? "Processing…" : "Reject"}
                    </button>
                    <button
                      onClick={() => handleVerification(selectedEmployee.employeeId, "APPROVED")}
                      disabled={actionLoading}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-40"
                    >
                      {actionLoading ? "Processing…" : "Approve"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>


    </>
  );
}