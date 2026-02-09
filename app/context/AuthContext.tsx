"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

// Types
export type UserRole = "ADMIN" | "EMPLOYEE";

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  password?: string; // In a real app, never store passwords in plain text/context
  profile?: EmployeeProfile;
}

export interface EmployeeProfile {
  name: string;
  email: string;
  phone: string;
  aadhaar?: string; // URL or base64
  pan?: string;
  otherDocs?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (id: string, pass: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  addEmployee: (emp: User) => void;
  updateEmployeeProfile: (id: string, profile: EmployeeProfile) => void;
  employees: User[]; // Mock database of employees
  token: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock Initial Data
const INITIAL_ADMIN: User = {
  id: "ADMIN001",
  name: "Super Admin",
  role: "ADMIN",
  password: "bigwig@2026",
};

const INITIAL_EMPLOYEES: User[] = [
  {
    id: "EMP001",
    name: "John Doe",
    role: "EMPLOYEE",
    password: "password",
  },
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [employees, setEmployees] = useState<User[]>(INITIAL_EMPLOYEES);
  const router = useRouter();

  // Load from localStorage on mount (mock persistence)
  useEffect(() => {
    const storedUser = localStorage.getItem("hrm_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const storedEmps = localStorage.getItem("hrm_employees");
    if (storedEmps) {
      setEmployees(JSON.parse(storedEmps));
    }
    const storedToken = localStorage.getItem("hrm_token");
    if (storedToken) setToken(storedToken);

    setLoading(false);
  }, []);

  // Save employees to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("hrm_employees", JSON.stringify(employees));
  }, [employees]);

  const login = async (id: string, pass: string, role: UserRole) => {
    try {
      // Attempt to fetch from backend API
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: id, password: pass }),
        },
      );

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.message || "Login failed");
        }

        const { token, employee } = data.data;

        // Map backend employee to frontend User
        const userData: User = {
          id: employee.employeeId,
          name: employee.name || employee.email.split("@")[0], // Fallback for name
          email: employee.email,
          role: employee.role as UserRole,
          profile: employee.profile, // Assuming backend might send profile, or we leave undefined
        };

        setUser(userData);
        localStorage.setItem("hrm_user", JSON.stringify(userData));
        // Ideally store token in cookie/localStorage as well

        setToken(token);
        localStorage.setItem("hrm_token", token);

        if (userData.role === "ADMIN") {
          toast.success("Welcome Admin!");
          router.push("/admin/dashboard");
        } else {
          toast.success(`Welcome ${userData.name}!`);
          router.push("/employee/dashboard");
        }
        return true;
      } else {
        // Response is not JSON (likely 404 HTML if backend missing)
        throw new Error("Backend API not available");
      }
    } catch (error: any) {
      console.warn("Backend login failed, falling back to mock logic:", error);

      // Fallback Mock Logic
      if (role === "ADMIN") {
        if (id === INITIAL_ADMIN.id && pass === INITIAL_ADMIN.password) {
          const adminUser = { ...INITIAL_ADMIN };
          setUser(adminUser);
          localStorage.setItem("hrm_user", JSON.stringify(adminUser));
          toast.success("Welcome Admin!");
          router.push("/admin/dashboard");
          return true;
        }
      } else {
        const emp = employees.find((e) => e.id === id && e.password === pass);
        if (emp) {
          setUser(emp);
          localStorage.setItem("hrm_user", JSON.stringify(emp));
          toast.success(`Welcome ${emp.name}!`);
          router.push("/employee/dashboard");
          return true;
        }
      }
      toast.error(error.message || "Invalid credentials");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("hrm_user");
    localStorage.removeItem("hrm_token");

    toast.info("Logged out successfully");
    router.push("/");
  };

  const addEmployee = (newEmp: User) => {
    if (employees.some((e) => e.id === newEmp.id)) {
      toast.error("Employee ID already exists");
      return;
    }
    setEmployees([...employees, newEmp]);
    toast.success("Employee added successfully");
  };

  const updateEmployeeProfile = (id: string, profile: EmployeeProfile) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, profile } : emp)),
    );
    // If current user is the one being updated, update state
    if (user && user.id === id) {
      const updatedUser = { ...user, profile };
      setUser(updatedUser);
      localStorage.setItem("hrm_user", JSON.stringify(updatedUser));
    }
    toast.success("Profile updated successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        addEmployee,
        updateEmployeeProfile,
        employees,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
