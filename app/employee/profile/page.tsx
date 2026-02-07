"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, FileText, Edit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function EmployeeProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user || user.role !== "employee") {
    if (typeof window !== "undefined") router.push("/employee/login");
    return null;
  }

  const { profile } = user;

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Profile Not Found</h2>
            <p className="text-gray-500 mt-2">You haven't submitted your details yet.</p>
        </div>
        <Link href="/employee/details" className="btn-primary">
            Complete Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <button
            onClick={() => router.push("/employee/dashboard")}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
            </button>
            <Link href="/employee/details" className="btn-secondary flex items-center space-x-2 text-sm">
                <Edit size={16} />
                <span>Edit Profile</span>
            </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header / Cover */}
            <div className="h-32 bg-gradient-to-r from-slate-800 to-blue-900"></div>
            
            <div className="px-8 pb-8">
                <div className="relative flex justify-between items-end -mt-12 mb-8">
                    <div className="p-1 bg-white rounded-full">
                        <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 border-4 border-white shadow-sm">
                            <User size={48} />
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Basic Info */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                        <p className="text-gray-500 flex items-center space-x-2 mt-1">
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">Employee</span>
                            <span>•</span>
                            <span>{user.id}</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card bg-gray-50 border-none">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Contact Information</h3>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white rounded-lg text-gray-400">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Email Address</p>
                                        <p className="text-gray-900 font-medium">{profile.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white rounded-lg text-gray-400">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Phone Number</p>
                                        <p className="text-gray-900 font-medium">{profile.phone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-gray-50 border-none">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Account Details</h3>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white rounded-lg text-gray-400">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Employee ID</p>
                                        <p className="text-gray-900 font-medium">{user.id}</p>
                                    </div>
                                </div>
                                {/* Add more details here if needed */}
                            </div>
                        </div>
                    </div>

                    {/* Documents */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Uploaded Documents</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Aadhaar */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                    <span className="font-medium text-gray-700">Aadhaar Card</span>
                                    {profile.aadhaar ? (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Uploaded</span>
                                    ) : (
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Missing</span>
                                    )}
                                </div>
                                <div className="aspect-video relative bg-gray-100 flex items-center justify-center">
                                    {profile.aadhaar ? (
                                        <Image src={profile.aadhaar} alt="Aadhaar" fill className="object-cover" />
                                    ) : (
                                        <span className="text-gray-400 text-sm">No preview available</span>
                                    )}
                                </div>
                            </div>

                            {/* PAN */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                    <span className="font-medium text-gray-700">PAN Card</span>
                                    {profile.pan ? (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Uploaded</span>
                                    ) : (
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Missing</span>
                                    )}
                                </div>
                                <div className="aspect-video relative bg-gray-100 flex items-center justify-center">
                                    {profile.pan ? (
                                        <Image src={profile.pan} alt="PAN" fill className="object-cover" />
                                    ) : (
                                        <span className="text-gray-400 text-sm">No preview available</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
