"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft, User, Mail, Phone, FileText, Edit,
  Building2, Briefcase, UserCheck, ChevronDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function EmployeeProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [docsOpen, setDocsOpen] = useState(false);

  if (!user || user.role !== "EMPLOYEE") {
    if (typeof window !== "undefined") router.push("/employee/login");
    return null;
  }

  const { profile } = user;

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Profile Not Found</h2>
          <p className="text-gray-500 mt-2">You have not submitted your details yet.</p>
        </div>
        <Link href="/employee/details" className="btn-primary">Complete Profile</Link>
      </div>
    );
  }

  const ed = (profile.employeeDetails ?? {}) as Record<string, unknown>;
  const department = (ed.department as { name?: string } | null | undefined)?.name ?? null;
  const designation = (ed.designation as { title?: string; code?: string; level?: number } | null | undefined) ?? null;
  const reportingManager = (ed.reportingManager as { employeeId?: string; email?: string; details?: { name?: string } } | null | undefined) ?? null;
  const reportingManagerName = reportingManager?.details?.name ?? null;
  const verificationStatus = (ed.verificationStatus as string | undefined) ?? user.verificationStatus ?? null;
  const isActive = (ed.isActive as boolean | undefined) ?? user.isActive ?? null;
  const employeeId = (ed.employeeId as string | undefined) ?? user.id;
  const profilePhone = profile.phone || ((ed.details as { contact?: string } | undefined)?.contact ?? "");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full mx-auto">

        {/* Top Nav */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push("/employee/dashboard")}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </button>
          <Link
            href="/employee/details"
            className="btn-secondary flex items-center space-x-2 text-sm"
          >
            <Edit size={16} />
            <span>Edit Profile</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">

          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-slate-800 to-blue-900" />

          <div className="px-8 pb-8">

            {/* Avatar + Name */}
            <div className="relative flex justify-between items-end -mt-12 mb-8">
              <div className="p-1 bg-white rounded-full shadow">
                {profile.photo?.url ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white bg-slate-200">
                    <Image
                      src={profile.photo.url}
                      alt={profile.name || "Employee photo"}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 border-4 border-white">
                    <User size={48} />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">

              {/* Name + Badge */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                    Employee
                  </span>
                  {employeeId && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-500 text-sm">{employeeId}</span>
                    </>
                  )}
                  {verificationStatus && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${verificationStatus === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : verificationStatus === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                      {verificationStatus}
                    </span>
                  )}
                  {isActive !== null && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}>
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Contact */}
                <div className="card bg-gray-50 border-none">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <InfoRow icon={<Mail size={20} />} label="Email Address" value={profile.email} />
                    <InfoRow icon={<Phone size={20} />} label="Phone Number" value={profilePhone} />
                  </div>
                </div>

                {/* Account */}
                <div className="card bg-gray-50 border-none">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Account Details
                  </h3>
                  <div className="space-y-4">
                    <InfoRow icon={<FileText size={20} />} label="Employee ID" value={employeeId} />
                  </div>
                </div>

                {/* Employment — only render if any field exists */}
                {(department || designation || reportingManager) && (
                  <div className="card bg-gray-50 border-none md:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                      Employment Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {department && (
                        <InfoRow
                          icon={<Building2 size={20} />}
                          label="Department"
                          value={department}
                        />
                      )}
                      {designation && (
                        <InfoRow
                          icon={<Briefcase size={20} />}
                          label="Designation"
                          value={
                            <>
                              <span className="block">{designation.title}</span>
                              {designation.code && (
                                <span className="ml-1 text-xs text-gray-400">
                                  ({designation.code})
                                </span>
                              )}
                              {designation.level != null && (
                                <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                  L{designation.level}
                                </span>
                              )}
                            </>
                          }
                        />
                      )}
                      {reportingManager && (
                        <InfoRow
                          icon={<UserCheck size={20} />}
                          label="Reporting Manager"
                          value={
                            <>
                              {reportingManagerName && (
                                <span className="block">{reportingManagerName}</span>
                              )}
                              <span className="text-sm text-gray-700">{reportingManager.employeeId}</span>
                              {reportingManager.email && (
                                <p className="text-xs text-gray-400 truncate">{reportingManager.email}</p>
                              )}
                            </>
                          }
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Documents Accordion */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDocsOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Uploaded Documents</h3>
                    <p className="text-sm text-gray-500">View your uploaded photo and identity documents</p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-500 transition-transform ${docsOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {docsOpen && (
                  <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <DocumentCard label="Your Photo" doc={profile.photo} alt="Photo" />
                    <DocumentCard label="Aadhaar Card" doc={profile.aadhaar} alt="Aadhaar" />
                    <DocumentCard label="PAN Card" doc={profile.pan} alt="PAN" />
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start space-x-3">
      <div className="p-2 bg-white rounded-lg text-gray-400 shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <div className="text-gray-900 font-medium">{value}</div>
      </div>
    </div>
  );
}

function DocumentCard({
  label,
  doc,
  alt,
}: {
  label: string;
  doc?: { url: string; publicId: string } | null;
  alt: string;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${doc ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
          {doc ? "Uploaded" : "Missing"}
        </span>
      </div>
      <div className="aspect-video relative bg-gray-100 flex items-center justify-center">
        {doc?.url ? (
          <Image src={doc.url} alt={alt} fill className="object-cover" />
        ) : (
          <span className="text-gray-400 text-sm">No preview available</span>
        )}
      </div>
    </div>
  );
}