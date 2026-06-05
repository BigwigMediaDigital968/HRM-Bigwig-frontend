"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

/* ================= TYPES ================= */

export type UserRole = "ADMIN" | "EMPLOYEE";

export interface UploadedDoc {
  url: string;
  publicId: string;
}

export interface EmployeeProfile {
  name: string;
  email: string;
  phone: string;
  photo?: UploadedDoc | null;
  aadhaar?: UploadedDoc | null;
  pan?: UploadedDoc | null;
  employeeDetails?: Record<string, unknown>;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  verificationStatus?: "PENDING" | "APPROVED" | "REJECTED";
  profile?: EmployeeProfile;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (id: string, pass: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ================= PROVIDER ================= */

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /* ---------- Restore session ---------- */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const path = window.location.pathname;

        let storedUser: string | null = null;
        let storedToken: string | null = null;

        if (path.startsWith("/admin")) {
          storedUser = localStorage.getItem("hrm_admin_user");
          storedToken = localStorage.getItem("hrm_admin_token");
        } else if (path.startsWith("/employee")) {
          storedUser = localStorage.getItem("hrm_employee_user");
          storedToken = localStorage.getItem("hrm_employee_token");
        }

        if (storedUser && storedToken) {
          const parsedUser: User = JSON.parse(storedUser);

          setUser(parsedUser);
          setToken(storedToken);

          // Refresh employee profile if missing
          if (
            parsedUser.role === "EMPLOYEE" &&
            !parsedUser.profile
          ) {
            await fetchEmployeeProfile(
              storedToken,
              parsedUser
            );
          }
        }
      } catch (error) {
        console.error("Session restore failed:", error);

        localStorage.removeItem("hrm_admin_user");
        localStorage.removeItem("hrm_admin_token");
        localStorage.removeItem("hrm_employee_user");
        localStorage.removeItem("hrm_employee_token");
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  /* ---------- Fetch employee profile safely ---------- */
  const fetchEmployeeProfile = async (
    authToken: string,
    baseUser: User
  ) => {
    if (baseUser.role !== "EMPLOYEE") return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/employee/details/me`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      // console.log(
      //   "Employee profile fetch response status:",
      //   res
      // );

      if (!res.ok) {
        console.warn(
          "Employee profile fetch blocked:",
          res.status
        );
        return;
      }

      const { data } = await res.json();

      if (!data) return;

      const employee = data;
      const details = (employee.details ?? {}) as {
        name?: string;
        email?: string;
        contact?: string;
        photo?: UploadedDoc | null;
        aadhaar?: UploadedDoc | null;
        pan?: UploadedDoc | null;
      };

      const updatedUser: User = {
        ...baseUser,
        name: details.name || employee.name || baseUser.name,
        email: details.email || employee.email || baseUser.email,
        verificationStatus: employee.verificationStatus ?? baseUser.verificationStatus,
        isActive: employee.isActive ?? baseUser.isActive,
        profile: {
          name: details.name || employee.name || baseUser.name,
          email: details.email || employee.email || baseUser.email,
          phone: details.contact || "",
          photo: details.photo ?? null,
          aadhaar: details.aadhaar ?? null,
          pan: details.pan ?? null,
          employeeDetails: {
            ...employee,
            employeeId: employee.employeeId ?? baseUser.id,
            department: employee.department ?? null,
            designation: employee.designation ?? null,
            reportingManager: employee.reportingManager ?? null,
            verificationStatus: employee.verificationStatus ?? baseUser.verificationStatus,
            isActive: employee.isActive ?? baseUser.isActive,
          },
        },
      };

      // console.log(
      //   "Final Profile:",
      //   updatedUser
      // );
      setUser(updatedUser);

      // FIXED BUG
      localStorage.setItem(
        "hrm_employee_user",
        JSON.stringify(updatedUser)
      );
    } catch (err: unknown) {
      console.error(
        "Employee profile fetch failed:",
        err
      );
    }
  };

  /* ---------- Login ---------- */
  const login = async (id: string, pass: string, role: UserRole) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: id, password: pass }),
        },
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Login failed");
      }

      const { token, employee } = json.data;

      if (employee.role !== role) {
        throw new Error(
          `Please login from the ${employee.role.toLowerCase()} portal`
        );
      }

      // console.log("LOGIN API RESPONSE - EMPLOYEE OBJECT:", employee);

      /* ================= CREATE USER SESSION FIRST ================= */

      const loggedUser: User = {
        id: employee.employeeId,
        name:
          employee.name ||
          employee.email?.split("@")[0],
        email: employee.email,
        role: employee.role,
        verificationStatus: employee.verificationStatus,
        isActive: employee.isActive,
      };

      setUser(loggedUser);
      setToken(token);

      if (employee.role === "ADMIN") {
        localStorage.setItem("hrm_admin_user", JSON.stringify(loggedUser));
        localStorage.setItem("hrm_admin_token", token);
      } else {
        localStorage.setItem("hrm_employee_user", JSON.stringify(loggedUser));
        localStorage.setItem("hrm_employee_token", token);
      }

      /* ================= FETCH PROFILE (OPTIONAL) ================= */


      if (employee.role === "EMPLOYEE") {
        // console.log("Fetching employee profile...");
        await fetchEmployeeProfile(token, loggedUser);
      }

      toast.success(`Welcome ${loggedUser.name}!`);

      /* ================= ROUTE BASED ON ROLE ================= */

      router.push(
        employee.role === "ADMIN" ? "/admin/dashboard" : "/employee/dashboard",
      );

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to login. Please try again.";

      console.error("Login failed:", err);

      toast.error(message);

      return false;
    }
  };

  /* ---------- Logout ---------- */
  const logout = () => {
    setUser(null);
    setToken(null);
    if (user?.role === "ADMIN") {
      localStorage.removeItem("hrm_admin_user");
      localStorage.removeItem("hrm_admin_token");
    } else {
      localStorage.removeItem("hrm_employee_user");
      localStorage.removeItem("hrm_employee_token");
    }

    toast.info("Logged out");
    router.replace("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
