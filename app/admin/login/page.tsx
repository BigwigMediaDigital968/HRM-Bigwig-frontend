"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(id, password, "ADMIN");
    setIsLoading(false);
  };
   const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
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

          <div className="w-full max-w-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>

            <div className="relative group">
              <input
                // Dynamically switch type
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                     outline-none transition-all pr-12" // Added padding-right for the icon
              />

              {/* Toggle Button */}
              <button
                type="button" // Important: prevents form submission on click
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 
                     text-gray-400 hover:text-blue-600 transition-colors 
                     rounded-md hover:bg-gray-100"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={20} strokeWidth={2} />
                ) : (
                  <Eye size={20} strokeWidth={2} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login as Admin"}
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
