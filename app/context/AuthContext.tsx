"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

// Types
export type UserRole = "admin" | "employee";

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
  login: (id: string, pass: string, role: UserRole) => boolean;
  logout: () => void;
  addEmployee: (emp: User) => void;
  updateEmployeeProfile: (id: string, profile: EmployeeProfile) => void;
  employees: User[]; // Mock database of employees
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock Initial Data
const INITIAL_ADMIN: User = {
  id: "admin",
  name: "Super Admin",
  role: "admin",
  password: "admin",
};

const INITIAL_EMPLOYEES: User[] = [
  {
    id: "EMP001",
    name: "John Doe",
    role: "employee",
    password: "password",
  },
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
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
  }, []);

  // Save employees to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("hrm_employees", JSON.stringify(employees));
  }, [employees]);

  const login = (id: string, pass: string, role: UserRole) => {
    if (role === "admin") {
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
    toast.error("Invalid credentials");
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("hrm_user");
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
