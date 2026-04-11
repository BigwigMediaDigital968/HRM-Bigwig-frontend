import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ChevronDown, ChevronRight, X } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  user: { name: string };
  logout: () => void;
}

import { LayoutDashboard, Users, Calendar, ClipboardCheck } from "lucide-react";

export const ADMIN_MENU = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Staffing",
    icon: Users,
    submenu: [
      { title: "Directory", href: "/admin/employee-management/employees", icon: Users },
      { title: "Leaves", href: "/admin/employee-management/leave-management", icon: Calendar },
    ],
  },
  {
    title: "Attendance",
    href: "/admin/attendance-management",
    icon: ClipboardCheck,
  },
];

export default function Sidebar({ isOpen, setIsOpen, user, logout }: SidebarProps) {
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({ Staffing: true });

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const NavItem = ({ item, isSub = false }: { item: any; isSub?: boolean }) => {
    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
    
    const baseStyles = `flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium`;
    const activeStyles = isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-400 hover:text-white hover:bg-slate-800/50";
    
    return (
      <Link href={item.href} onClick={() => setIsOpen(false)} className={`${baseStyles} ${activeStyles} ${isSub ? "text-sm" : ""}`}>
        <item.icon size={isSub ? 18 : 20} />
        <span>{item.title}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Bigwig HRM</h1>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Administrator</p>
          </div>
          <button className="lg:hidden p-1 text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}><X size={20}/></button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {ADMIN_MENU.map((item) => (
            <div key={item.title}>
              {item.submenu ? (
                <>
                  <button onClick={() => toggleSubmenu(item.title)} className="flex items-center justify-between w-full px-4 py-3 text-slate-400 hover:text-white transition-colors">
                    <div className="flex items-center space-x-3"><item.icon size={20} /> <span className="font-medium">{item.title}</span></div>
                    {openSubmenus[item.title] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {openSubmenus[item.title] && (
                    <div className="ml-4 mt-1 border-l border-slate-800 pl-2 space-y-1">
                      {item.submenu.map((sub) => <NavItem key={sub.href} item={sub} isSub />)}
                    </div>
                  )}
                </>
              ) : <NavItem item={item} />}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-blue-400">{user.name[0]}</div>
            <div className="truncate font-medium text-sm text-slate-300">{user.name}</div>
          </div>
          <button onClick={logout} className="flex items-center space-x-3 px-4 py-2.5 text-red-400 hover:text-red-300 w-full hover:bg-red-400/10 rounded-lg transition-colors">
            <LogOut size={20} /> <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}