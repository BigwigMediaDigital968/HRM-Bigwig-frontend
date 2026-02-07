"use client";

import Link from "next/link";
import { ShieldCheck, UserCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            Bigwig Media <span className="text-blue-400">HRM</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Welcome to the internal Human Resource Management portal. Please select your portal to continue.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-12">
          {/* Admin Portal Card */}
          <Link
            href="/admin/login"
            className="group relative p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl hover:border-blue-500/50 hover:bg-slate-800 transition-all duration-300 flex flex-col items-center text-center space-y-4"
          >
            <div className="p-4 bg-slate-700/50 rounded-full group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
              <ShieldCheck size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Admin Portal</h2>
              <p className="text-slate-400 mt-2">
                Manage employees, roles, and system settings.
              </p>
            </div>
          </Link>

          {/* Employee Portal Card */}
          <Link
            href="/employee/login"
            className="group relative p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl hover:border-green-500/50 hover:bg-slate-800 transition-all duration-300 flex flex-col items-center text-center space-y-4"
          >
            <div className="p-4 bg-slate-700/50 rounded-full group-hover:bg-green-500/20 group-hover:text-green-400 transition-colors">
              <UserCircle size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Employee Portal</h2>
              <p className="text-slate-400 mt-2">
                View profile, upload documents, and manage details.
              </p>
            </div>
          </Link>
        </div>

        <footer className="pt-12 text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Bigwig Media. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
