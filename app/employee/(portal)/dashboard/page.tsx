"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, User, FileText, LayoutGrid } from "lucide-react";
import Link from "next/link";

export default function EmployeeDashboard() {
  const { user, logout, loading, token } = useAuth();
  const router = useRouter();

  const [hasSubmittedDetails, setHasSubmittedDetails] = useState(false);

  /* ================= AUTH CHECK ================= */

  useEffect(() => {
    if (!loading && (!user || user.role !== "EMPLOYEE")) {
      router.replace("/employee/login");
    }
  }, [user, loading, router]);

  /* ================= CHECK IF DETAILS EXIST ================= */

  useEffect(() => {
    const checkDetails = async () => {
      if (!token) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/employee/details/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (res.ok) {
          setHasSubmittedDetails(true);
        } else {
          setHasSubmittedDetails(false);
        }
      } catch (error) {
        console.error("Error checking employee details:", error);
      }
    };

    checkDetails();
  }, [token]);

  if (loading || !user || user.role !== "EMPLOYEE") {
    return null;
  }

  /* ================= STATUS LOGIC ================= */

  const isApproved =
    hasSubmittedDetails && user.verificationStatus === "APPROVED";

  const isRejected =
    hasSubmittedDetails && user.verificationStatus === "REJECTED";

  const isPending =
    hasSubmittedDetails && user.verificationStatus === "PENDING";

  return (
    <div className="space-y-8">
      {isPending && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg text-center">
          Your submitted details are under verification by admin.
        </div>
      )}

      {isRejected && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
          Your submitted details were rejected. Please update and resubmit.
        </div>
      )}

      {/* {isApproved && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-center">
          Your profile has been approved successfully.
        </div>
      )} */}

      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          What would you like to do?
        </h2>
        <p className="text-gray-500 mt-2">
          Manage your profile and documents easily.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {!isApproved && (
          <Link
            href="/employee/details"
            className="bg-white rounded-xl shadow-sm border hover:shadow-md transition p-10 text-center"
          >
            <FileText size={40} className="mx-auto text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold">Complete Details</h3>
            <p className="text-gray-500 mt-2 text-sm">
              Update personal info and upload documents.
            </p>
          </Link>
        )}

        {/* <Link
          href="/employee/profile"
          className="bg-white rounded-xl shadow-sm border hover:shadow-md transition p-10 text-center"
        >
          <User size={40} className="mx-auto text-green-600 mb-4" />
          <h3 className="text-lg font-semibold">View Profile</h3>
          <p className="text-gray-500 mt-2 text-sm">
            View submitted details and status.
          </p>
        </Link> */}
      </div>
    </div>
  );
}
