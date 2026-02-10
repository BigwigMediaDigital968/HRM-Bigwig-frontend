"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut, User, FileText, LayoutGrid } from "lucide-react";
import Link from "next/link";

export default function EmployeeDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  console.log(user);

  // Redirect AFTER render
  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYEE")) {
      router.replace("/employee/login");
    }
  }, [user, loading, router]);

  // Prevent flicker while checking auth
  if (loading || !user || user.role !== "EMPLOYEE") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <LayoutGrid className="text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Employee Portal</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 text-sm hidden sm:block">
              Welcome,{" "}
              <span className="font-semibold text-gray-900">{user.name}</span>
            </span>
            <button
              onClick={logout}
              className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            What would you like to do?
          </h2>
          <p className="text-gray-500 mt-2">
            Manage your profile and documents easily.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Complete Details */}
          <Link
            href="/employee/details"
            className="group card hover:shadow-md hover:border-blue-300 transition-all duration-300 flex flex-col items-center text-center p-10"
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-semibold">Complete Details</h3>
            <p className="text-gray-500 mt-2">
              Update your personal information and upload mandatory documents.
            </p>
          </Link>

          {/* View Profile */}
          <Link
            href="/employee/profile"
            className="group card hover:shadow-md hover:border-green-300 transition-all duration-300 flex flex-col items-center text-center p-10"
          >
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <User size={32} />
            </div>
            <h3 className="text-xl font-semibold">View Profile</h3>
            <p className="text-gray-500 mt-2">
              View your submitted details and document status.
            </p>
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Bigwig Media. All rights reserved.
      </footer>
    </div>
  );
}
