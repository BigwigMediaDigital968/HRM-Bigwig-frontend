"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/app/Hooks/useApi";

/* ─────────────────────────── types ─────────────────────────── */
interface Department {
    _id: string;
    name: string;
    createdAt: string;
}

interface Designation {
    _id: string;
    code: string;           // e.g. SDE1, TL
    title: string;          // e.g. Software Engineer
    level: number;          // hierarchy level
    department: string;     // plain string — NOT a ref
    parentDesignation: { _id: string; code: string; title: string; level: number } | null;
    isActive: boolean;
    createdAt: string;
}

/* ─────────────────────────── helpers ─────────────────────────── */
function EmptyState({ message }: { message: string }) {
    return <div className="py-16 text-center text-gray-400 text-sm">{message}</div>;
}

function FormField({
    label,
    children,
    error,
}: {
    label: string;
    children: React.ReactNode;
    error?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
        </div>
    );
}

const LEVEL_COLORS: Record<number, string> = {
    1: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    2: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    3: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    4: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
    5: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

function LevelBadge({ level }: { level: number }) {
    const cls = LEVEL_COLORS[level] ?? LEVEL_COLORS[5];
    return (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
            L{level}
        </span>
    );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function OrganizationManagement() {
    const api = useApi();
    const [activeTab, setActiveTab] = useState<"departments" | "designations">("departments");

    /* ── department state ── */
    const [departments, setDepartments] = useState<Department[]>([]);
    const [deptLoading, setDeptLoading] = useState(true);
    const [deptSearch, setDeptSearch] = useState("");
    const [deptModalOpen, setDeptModalOpen] = useState(false);
    const [deptFormName, setDeptFormName] = useState("");
    const [deptFormError, setDeptFormError] = useState("");
    const [deptSaving, setDeptSaving] = useState(false);
    const [deptDeleteConfirm, setDeptDeleteConfirm] = useState<Department | null>(null);
    const [deptDeleting, setDeptDeleting] = useState(false);
    const [deptEditTarget, setDeptEditTarget] = useState<Department | null>(null);

    /* ── designation state ── */
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [desigLoading, setDesigLoading] = useState(true);
    const [desigSearch, setDesigSearch] = useState("");
    const [desigFilterDept, setDesigFilterDept] = useState("ALL");
    const [desigFilterActive, setDesigFilterActive] = useState("ALL");
    const [desigModalOpen, setDesigModalOpen] = useState(false);
    const [desigEditTarget, setDesigEditTarget] = useState<Designation | null>(null);
    const [desigFormError, setDesigFormError] = useState("");
    const [desigSaving, setDesigSaving] = useState(false);
    const [desigDeleteConfirm, setDesigDeleteConfirm] = useState<Designation | null>(null);
    const [desigDeleting, setDesigDeleting] = useState(false);
    const [desigTogglingId, setDesigTogglingId] = useState<string | null>(null);

    /* designation form fields */
    const [desigCode, setDesigCode] = useState("");
    const [desigTitle, setDesigTitle] = useState("");
    const [desigLevel, setDesigLevel] = useState<number | "">("");
    const [desigDept, setDesigDept] = useState("");
    const [desigParent, setDesigParent] = useState("");

    const [showDeptDropdown, setShowDeptDropdown] = useState(false);

    /* ─────────────────────── fetch ─────────────────────── */
    const fetchDepartments = async () => {
        try {
            setDeptLoading(true);
            const data = await api("/api/admin/departments");
            setDepartments(data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setDeptLoading(false);
        }
    };

    const fetchDesignations = async () => {
        try {
            setDesigLoading(true);
            const data = await api("/api/admin/designations");
            setDesignations(data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setDesigLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
        fetchDesignations();
    }, []);

    /* ─────────────────────── derived ─────────────────────── */
    const filteredDepts = departments.filter(
        (d) => !deptSearch || d.name.toLowerCase().includes(deptSearch.toLowerCase())
    );

    // collect unique dept strings from designations for filter dropdown
    const uniqueDesigDepts = Array.from(new Set(designations.map((d) => d.department).filter(Boolean)));

    const filteredDesigs = designations.filter((d) => {
        const q = desigSearch.toLowerCase();
        const matchSearch =
            !q ||
            d.title.toLowerCase().includes(q) ||
            d.code.toLowerCase().includes(q) ||
            d.department?.toLowerCase().includes(q);
        const matchDept = desigFilterDept === "ALL" || d.department === desigFilterDept;
        const matchActive =
            desigFilterActive === "ALL" ||
            (desigFilterActive === "ACTIVE" ? d.isActive : !d.isActive);
        return matchSearch && matchDept && matchActive;
    });

    /* ─────────────────────── department actions ─────────────────────── */
    const openAddDept = () => {
        setDeptEditTarget(null);
        setDeptFormName("");
        setDeptFormError("");
        setDeptModalOpen(true);
    };

    const openEditDept = (dept: Department) => {
        setDeptEditTarget(dept);
        setDeptFormName(dept.name);
        setDeptFormError("");
        setDeptModalOpen(true);
    };

    const handleSaveDept = async () => {
        if (!deptFormName.trim()) { setDeptFormError("Department name is required."); return; }
        try {
            setDeptSaving(true);
            setDeptFormError("");
            if (deptEditTarget) {
                await api(`/api/admin/departments/${deptEditTarget._id}`, {
                    method: "PUT",
                    body: JSON.stringify({ name: deptFormName.trim() }),
                });
            } else {
                await api("/api/admin/departments", {
                    method: "POST",
                    body: JSON.stringify({ name: deptFormName.trim() }),
                });
            }
            await fetchDepartments();
            setDeptModalOpen(false);
        } catch (e: any) {
            setDeptFormError(e?.message || "Failed to save department.");
        } finally {
            setDeptSaving(false);
        }
    };

    const handleDeleteDept = async () => {
        if (!deptDeleteConfirm) return;
        try {
            setDeptDeleting(true);
            await api(`/api/admin/departments/${deptDeleteConfirm._id}`, { method: "DELETE" });
            await fetchDepartments();
            setDeptDeleteConfirm(null);
        } catch (e) {
            console.error(e);
        } finally {
            setDeptDeleting(false);
        }
    };

    /* ─────────────────────── designation actions ─────────────────────── */
    const resetDesigForm = () => {
        setDesigCode("");
        setDesigTitle("");
        setDesigLevel("");
        setDesigDept("");
        setDesigParent("");
        setDesigFormError("");
    };

    const openAddDesig = () => {
        setDesigEditTarget(null);
        resetDesigForm();
        setDesigModalOpen(true);
    };

    const openEditDesig = (desig: Designation) => {
        setDesigEditTarget(desig);
        setDesigCode(desig.code);
        setDesigTitle(desig.title);
        setDesigLevel(desig.level);
        setDesigDept(desig.department || "");
        setDesigParent(desig.parentDesignation?._id || "");
        setDesigFormError("");
        setDesigModalOpen(true);
    };

    const handleSaveDesig = async () => {
        if (!desigCode.trim()) { setDesigFormError("Code is required."); return; }
        if (!desigTitle.trim()) { setDesigFormError("Title is required."); return; }
        if (!desigLevel || Number(desigLevel) < 1) { setDesigFormError("Level must be a positive number."); return; }
        if (!desigDept.trim()) { setDesigFormError("Department is required."); return; }
        try {
            setDesigSaving(true);
            setDesigFormError("");
            const payload = {
                code: desigCode.trim().toUpperCase(),
                title: desigTitle.trim(),
                level: Number(desigLevel),
                department: desigDept.trim(),
                parentDesignation: desigParent || null,
            };
            if (desigEditTarget) {
                await api(`/api/admin/designations/${desigEditTarget._id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
            } else {
                await api("/api/admin/designations", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
            }
            await fetchDesignations();
            setDesigModalOpen(false);
        } catch (e: any) {
            setDesigFormError(e?.message || "Failed to save designation.");
        } finally {
            setDesigSaving(false);
        }
    };

    const handleDeleteDesig = async () => {
        if (!desigDeleteConfirm) return;
        try {
            setDesigDeleting(true);
            await api(`/api/admin/designations/${desigDeleteConfirm._id}`, { method: "DELETE" });
            await fetchDesignations();
            setDesigDeleteConfirm(null);
        } catch (e) {
            console.error(e);
        } finally {
            setDesigDeleting(false);
        }
    };

    const handleToggleDesigActive = async (desig: Designation) => {
        try {
            setDesigTogglingId(desig._id);
            await api(`/api/admin/designations/${desig._id}`, {
                method: "PUT",
                body: JSON.stringify({ isActive: !desig.isActive }),
            });
            await fetchDesignations();
        } catch (e) {
            console.error(e);
        } finally {
            setDesigTogglingId(null);
        }
    };

    /* ═══════════════════════════ render ═══════════════════════════ */
    return (
        <div className="max-w-screen-xl mx-auto px-3 sm:px-5 py-6 space-y-6">

            {/* ── summary strip ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Departments", value: departments.length, color: "bg-slate-50 border-slate-200" },
                    { label: "Designations", value: designations.length, color: "bg-sky-50 border-sky-200" },
                    { label: "Active", value: designations.filter((d) => d.isActive).length, color: "bg-emerald-50 border-emerald-200" },
                    { label: "Inactive", value: designations.filter((d) => !d.isActive).length, color: "bg-amber-50 border-amber-200" },
                ].map(({ label, value, color }) => (
                    <div key={label} className={`rounded-xl border px-4 py-3 ${color}`}>
                        <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
                        <p className="text-2xl font-semibold text-gray-800">{value}</p>
                    </div>
                ))}
            </div>

            {/* ── tabs ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {(["departments", "designations"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 sm:flex-none px-6 py-3.5 text-sm font-medium capitalize transition-colors ${activeTab === tab
                                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/40"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            {tab}
                            <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === tab ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                                }`}>
                                {tab === "departments" ? departments.length : designations.length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ════════ DEPARTMENTS TAB ════════ */}
                {activeTab === "departments" && (
                    <>
                        <div className="px-5 pt-5 pb-4 border-b border-gray-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">Departments</h2>
                                    <span className="text-xs text-gray-400">{filteredDepts.length} of {departments.length}</span>
                                </div>
                                <button
                                    onClick={openAddDept}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                                >
                                    + Add Department
                                </button>
                            </div>
                            <div className="relative max-w-xs">
                                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={deptSearch}
                                    onChange={(e) => setDeptSearch(e.target.value)}
                                    placeholder="Search departments…"
                                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {deptLoading ? (
                            <EmptyState message="Loading departments…" />
                        ) : filteredDepts.length === 0 ? (
                            <EmptyState message="No departments found." />
                        ) : (
                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                            <th className="px-5 py-3 text-left">Department Name</th>
                                            <th className="px-5 py-3 text-left">Designations</th>
                                            <th className="px-5 py-3 text-left">Created</th>
                                            <th className="px-5 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredDepts.map((dept) => {
                                            const desigCount = designations.filter((d) => d.department === dept.name).length;
                                            return (
                                                <tr key={dept._id} className="hover:bg-gray-50/60 transition-colors">
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                                <span className="text-blue-600 text-xs font-bold">{dept.name.charAt(0).toUpperCase()}</span>
                                                            </div>
                                                            <span className="font-semibold text-gray-900">{dept.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 ring-1 ring-sky-200">
                                                            {desigCount} designation{desigCount !== 1 ? "s" : ""}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                                                        {new Date(dept.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => openEditDept(dept)} className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition">Edit</button>
                                                            <button onClick={() => setDeptDeleteConfirm(dept)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* ════════ DESIGNATIONS TAB ════════ */}
                {activeTab === "designations" && (
                    <>
                        <div className="px-5 pt-5 pb-4 border-b border-gray-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">Designations</h2>
                                    <span className="text-xs text-gray-400">{filteredDesigs.length} of {designations.length}</span>
                                </div>
                                <button
                                    onClick={openAddDesig}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                                >
                                    + Add Designation
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <div className="relative flex-1 min-w-[160px]">
                                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={desigSearch}
                                        onChange={(e) => setDesigSearch(e.target.value)}
                                        placeholder="Search title, code, department…"
                                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <select
                                    value={desigFilterDept}
                                    onChange={(e) => setDesigFilterDept(e.target.value)}
                                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="ALL">All departments</option>
                                    {uniqueDesigDepts.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                                <select
                                    value={desigFilterActive}
                                    onChange={(e) => setDesigFilterActive(e.target.value)}
                                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="ALL">All statuses</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {desigLoading ? (
                            <EmptyState message="Loading designations…" />
                        ) : filteredDesigs.length === 0 ? (
                            <EmptyState message="No designations match your filters." />
                        ) : (
                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                            <th className="px-5 py-3 text-left">Code</th>
                                            <th className="px-5 py-3 text-left">Title</th>
                                            <th className="px-5 py-3 text-left">Level</th>
                                            <th className="px-5 py-3 text-left">Department</th>
                                            <th className="px-5 py-3 text-left">Reports To</th>
                                            <th className="px-5 py-3 text-left">Status</th>
                                            <th className="px-5 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredDesigs.map((desig) => (
                                            <tr key={desig._id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                                                        {desig.code}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-indigo-600 text-xs font-bold">{desig.title.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                        <span className="font-semibold text-gray-900">{desig.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <LevelBadge level={desig.level} />
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {desig.department ? (
                                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                                                            {desig.department}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {desig.parentDesignation ? (
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-xs font-medium text-gray-700">{desig.parentDesignation.title}</span>
                                                            <span className="font-mono text-xs text-gray-400">{desig.parentDesignation.code}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${desig.isActive
                                                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                                            : "bg-red-50 text-red-600 ring-1 ring-red-200"
                                                        }`}>
                                                        {desig.isActive ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => openEditDesig(desig)} className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition">Edit</button>
                                                        <button
                                                            onClick={() => handleToggleDesigActive(desig)}
                                                            disabled={desigTogglingId === desig._id}
                                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition disabled:opacity-40 ${desig.isActive
                                                                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                                }`}
                                                        >
                                                            {desigTogglingId === desig._id ? "…" : desig.isActive ? "Deactivate" : "Activate"}
                                                        </button>
                                                        <button onClick={() => setDesigDeleteConfirm(desig)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ════════════════ DEPARTMENT MODAL ════════════════ */}
            {deptModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={(e) => { if (e.target === e.currentTarget) setDeptModalOpen(false); }}>
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h3 className="font-semibold text-gray-900">{deptEditTarget ? "Edit Department" : "Add Department"}</h3>
                                <p className="text-xs text-gray-400 mt-0.5">{deptEditTarget ? `Editing: ${deptEditTarget.name}` : "Create a new department"}</p>
                            </div>
                            <button onClick={() => setDeptModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400">✕</button>
                        </div>
                        <div className="px-6 py-5">
                            <FormField label="Department Name" error={deptFormError}>
                                <input
                                    type="text"
                                    value={deptFormName}
                                    onChange={(e) => { setDeptFormName(e.target.value); setDeptFormError(""); }}
                                    placeholder="e.g. Engineering, HR, Finance…"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </FormField>
                        </div>
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <button onClick={() => setDeptModalOpen(false)} className="px-4 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={handleSaveDept} disabled={deptSaving} className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-40">
                                {deptSaving ? "Saving…" : deptEditTarget ? "Save Changes" : "Create Department"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════ DESIGNATION MODAL ════════════════ */}
            {desigModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center px-4 py-10 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setDesigModalOpen(false); }}>
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h3 className="font-semibold text-gray-900">{desigEditTarget ? "Edit Designation" : "Add Designation"}</h3>
                                <p className="text-xs text-gray-400 mt-0.5">{desigEditTarget ? `Editing: ${desigEditTarget.title}` : "Create a new designation"}</p>
                            </div>
                            <button onClick={() => setDesigModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400">✕</button>
                        </div>
                        <div className="px-6 py-5 space-y-4">

                            {/* Code + Title */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Code *">
                                    <input
                                        type="text"
                                        value={desigCode}
                                        onChange={(e) => { setDesigCode(e.target.value.toUpperCase()); setDesigFormError(""); }}
                                        placeholder="e.g. SDE1, TL, HRM"
                                        className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                </FormField>
                                <FormField label="Level *">
                                    <input
                                        type="number"
                                        min={1}
                                        value={desigLevel}
                                        onChange={(e) => { setDesigLevel(e.target.value === "" ? "" : Number(e.target.value)); setDesigFormError(""); }}
                                        placeholder="e.g. 1, 2, 3…"
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </FormField>
                            </div>

                            <FormField label="Title *">
                                <input
                                    type="text"
                                    value={desigTitle}
                                    onChange={(e) => { setDesigTitle(e.target.value); setDesigFormError(""); }}
                                    placeholder="e.g. Software Engineer, Team Lead…"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </FormField>

                            {/* Department — plain string input with datalist from departments */}
                            <FormField label="Department *">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={desigDept}
                                        onChange={(e) => {
                                            setDesigDept(e.target.value);
                                            setShowDeptDropdown(true);
                                            setDesigFormError("");
                                        }}
                                        onFocus={() => setShowDeptDropdown(true)}
                                        placeholder="Search department..."
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    {showDeptDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {departments
                                                .filter((d) =>
                                                    d.name.toLowerCase().includes(desigDept.toLowerCase())
                                                )
                                                .map((d) => (
                                                    <div
                                                        key={d._id}
                                                        onClick={() => {
                                                            setDesigDept(d.name);
                                                            setShowDeptDropdown(false);
                                                        }}
                                                        className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50"
                                                    >
                                                        {d.name}
                                                    </div>
                                                ))}

                                            {departments.filter((d) =>
                                                d.name.toLowerCase().includes(desigDept.toLowerCase())
                                            ).length === 0 && (
                                                    <div className="px-3 py-2 text-sm text-gray-500">
                                                        No departments found
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </FormField>

                            {/* Parent Designation */}
                            <FormField label="Reports To (Parent Designation)">
                                <select
                                    value={desigParent}
                                    onChange={(e) => setDesigParent(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">None (top-level)</option>
                                    {designations
                                        .filter((d) => d._id !== desigEditTarget?._id)
                                        .sort((a, b) => a.level - b.level)
                                        .map((d) => (
                                            <option key={d._id} value={d._id}>
                                                [{d.code}] {d.title} — L{d.level} · {d.department}
                                            </option>
                                        ))}
                                </select>
                            </FormField>

                            {desigFormError && <p className="text-xs text-red-500">{desigFormError}</p>}
                        </div>
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <button onClick={() => setDesigModalOpen(false)} className="px-4 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={handleSaveDesig} disabled={desigSaving} className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-40">
                                {desigSaving ? "Saving…" : desigEditTarget ? "Save Changes" : "Create Designation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════ DELETE CONFIRM — DEPT ════════════════ */}
            {deptDeleteConfirm && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={(e) => { if (e.target === e.currentTarget) setDeptDeleteConfirm(null); }}>
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-5">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">Delete Department</h3>
                            <p className="text-sm text-gray-500">Are you sure you want to delete <span className="font-medium text-gray-800">"{deptDeleteConfirm.name}"</span>? This cannot be undone.</p>
                        </div>
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <button onClick={() => setDeptDeleteConfirm(null)} className="px-4 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={handleDeleteDept} disabled={deptDeleting} className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-40">
                                {deptDeleting ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════ DELETE CONFIRM — DESIG ════════════════ */}
            {desigDeleteConfirm && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={(e) => { if (e.target === e.currentTarget) setDesigDeleteConfirm(null); }}>
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-5">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">Delete Designation</h3>
                            <p className="text-sm text-gray-500">Are you sure you want to delete <span className="font-medium text-gray-800">"{desigDeleteConfirm.title}"</span> ({desigDeleteConfirm.code})? This cannot be undone.</p>
                        </div>
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <button onClick={() => setDesigDeleteConfirm(null)} className="px-4 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={handleDeleteDesig} disabled={desigDeleting} className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-40">
                                {desigDeleting ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}