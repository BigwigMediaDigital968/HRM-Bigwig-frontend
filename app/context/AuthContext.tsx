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
  photo?: UploadedDoc;
  aadhaar?: UploadedDoc;
  pan?: UploadedDoc;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  verificationStatus?: "PENDING" | "APPROVED" | "REJECTED";
  profile?: EmployeeProfile;
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
    const storedUser = localStorage.getItem("hrm_user");
    const storedToken = localStorage.getItem("hrm_token");

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedToken) setToken(storedToken);

    setLoading(false);
  }, []);

  /* ---------- Fetch employee profile safely ---------- */
  const fetchEmployeeProfile = async (authToken: string, baseUser: User) => {
    if (baseUser.role !== "EMPLOYEE") return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/employee/details/me`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      if (!res.ok) {
        console.warn("Employee profile fetch blocked:", res.status);
        return;
      }

      const { data } = await res.json();

      const updatedUser: User = {
        ...baseUser,
        profile: {
          name: data.name,
          email: data.email,
          phone: data.contact,
          photo: data.photo,
          aadhaar: data.aadhaar,
          pan: data.pan,
        },
      };

      setUser(updatedUser);
      localStorage.setItem("hrm_user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Employee profile fetch failed:", err);
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

      console.log("LOGIN API RESPONSE - EMPLOYEE OBJECT:", employee);

      /* ================= CREATE USER SESSION FIRST ================= */

      const loggedUser: User = {
        id: employee.employeeId,
        name: employee.email.split("@")[0],
        email: employee.email,
        role: employee.role,
        verificationStatus: employee.verificationStatus,
      };

      setUser(loggedUser);
      setToken(token);

      localStorage.setItem("hrm_user", JSON.stringify(loggedUser));
      localStorage.setItem("hrm_token", token);

      /* ================= FETCH PROFILE (OPTIONAL) ================= */

      if (employee.role === "EMPLOYEE") {
        await fetchEmployeeProfile(token, loggedUser);
      }

      toast.success(`Welcome ${loggedUser.name}!`);

      /* ================= ROUTE BASED ON ROLE ================= */

      router.push(
        employee.role === "ADMIN" ? "/admin/dashboard" : "/employee/dashboard",
      );

      return true;
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
      return false;
    }
  };

  /* ---------- Logout ---------- */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
    toast.info("Logged out");
    router.push("/");
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
