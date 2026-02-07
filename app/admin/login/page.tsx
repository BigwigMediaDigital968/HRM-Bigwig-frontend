"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(id, password, "admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>
          <p className="text-gray-500 mt-2">Access the HRM Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin ID
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="input-field"
              placeholder="Enter Admin ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter Password"
              required
            />
          </div>

          <button type="submit" className="w-full btn-primary py-3">
            Login as Admin
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
