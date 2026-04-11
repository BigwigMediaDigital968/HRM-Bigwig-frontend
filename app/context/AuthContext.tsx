"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

/* ================= TYPES ================= */

export type UserRole = "ADMIN" | "EMPLOYEE";

const DEV_MODE = process.env.NODE_ENV === "development";

const DUMMY_ADMIN: User = {
  id: "admin_001",
  name: "Admin User",
  email: "admin@test.com",
  role: "ADMIN",
  verificationStatus: "APPROVED",
  isActive: true,
  profile: {
    name: "Admin User",
    email: "admin@test.com",
    phone: "9999999999",
  },
};

const DUMMY_EMPLOYEE: User = {
  id: "emp_001",
  name: "Employee User",
  email: "employee@test.com",
  role: "EMPLOYEE",
  verificationStatus: "PENDING",
  isActive: true,
  profile: {
    name: "Employee User",
    email: "employee@test.com",
    phone: "8888888888",
    photo: {
      url: "https://via.placeholder.com/150",
      publicId: "dummy_photo",
    },
    aadhaar: {
      url: "https://via.placeholder.com/150",
      publicId: "dummy_aadhaar",
    },
    pan: {
      url: "https://via.placeholder.com/150",
      publicId: "dummy_pan",
    },
  },
};

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
  const restoreSession = () => {
    const path = window.location.pathname;

    // ✅ DEV MODE AUTO LOGIN
    if (DEV_MODE) {
      const mockUser =
        path.startsWith("/admin") ? DUMMY_ADMIN : DUMMY_EMPLOYEE;

      setUser(mockUser);
      setToken("dummy-token");
      setLoading(false);
      return;
    }

    // ================= REAL LOGIC =================
    if (path.startsWith("/admin")) {
      const storedUser = localStorage.getItem("hrm_admin_user");
      const storedToken = localStorage.getItem("hrm_admin_token");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } else if (path.startsWith("/employee")) {
      const storedUser = localStorage.getItem("hrm_employee_user");
      const storedToken = localStorage.getItem("hrm_employee_token");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    }

    setLoading(false);
  };

  restoreSession();
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
      const mockUser = role === "ADMIN" ? DUMMY_ADMIN : DUMMY_EMPLOYEE;

      setUser(mockUser);
      setToken("dummy-token");

      toast.success(`Welcome ${mockUser.name}!`);

      router.push(
        role === "ADMIN" ? "/admin/dashboard" : "/employee/dashboard",
      );

      return true;
      
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

      // console.log("LOGIN API RESPONSE - EMPLOYEE OBJECT:", employee);

      /* ================= CREATE USER SESSION FIRST ================= */

      const loggedUser: User = {
        id: employee.employeeId,
        name: employee.email.split("@")[0],
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
    if (user?.role === "ADMIN") {
      localStorage.removeItem("hrm_admin_user");
      localStorage.removeItem("hrm_admin_token");
    } else {
      localStorage.removeItem("hrm_employee_user");
      localStorage.removeItem("hrm_employee_token");
    }

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
