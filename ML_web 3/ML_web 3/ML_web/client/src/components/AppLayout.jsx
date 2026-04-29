import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, LineChart, Users, Settings as SettingsIcon, LogOut, BarChart4, Menu, X, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

function navClassName({ isActive }) {
  return `flex items-center px-4 py-3 rounded-xl transition-all duration-200 font-medium border border-transparent ${
    isActive
      ? "bg-pink-600 text-white shadow-md shadow-pink-500/30 font-semibold"
      : "text-slate-600 hover:bg-white hover:text-pink-700 hover:border-slate-200 hover:shadow-sm"
  }`;
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { disconnectSocket } = useSocket();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "U";

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate("/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  const sidebarContent = (
    <>
      <div className="mb-8 px-2 lg:mt-4">
        <p className="text-[10px] uppercase tracking-widest font-bold text-pink-600 mb-1">CS Analytics</p>
        <h2 className="text-2xl font-bold text-slate-900 leading-tight tracking-tight">ML Workforce<br/>Center</h2>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        <NavLink to="/" className={navClassName} end onClick={closeSidebar}>
          <LayoutDashboard className="w-5 h-5 mr-3 shrink-0" />
          Dashboard
        </NavLink>
        <NavLink to="/performance" className={navClassName} onClick={closeSidebar}>
          <LineChart className="w-5 h-5 mr-3 shrink-0" />
          Performance Details
        </NavLink>
        <NavLink to="/analytics" className={navClassName} onClick={closeSidebar}>
          <BarChart4 className="w-5 h-5 mr-3 shrink-0" />
          Analytics & Reports
        </NavLink>
        <NavLink to="/team" className={navClassName} onClick={closeSidebar}>
          <Users className="w-5 h-5 mr-3 shrink-0" />
          Team Management
        </NavLink>
        <NavLink to="/support" className={navClassName} onClick={closeSidebar}>
          <MessageSquare className="w-5 h-5 mr-3 shrink-0" />
          Agent Chat Console
        </NavLink>
        <NavLink to="/settings" className={navClassName} onClick={closeSidebar}>
          <SettingsIcon className="w-5 h-5 mr-3 shrink-0" />
          Global Settings
        </NavLink>
      </nav>

      {/* User profile & Logout */}
      {user && (
        <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-bold border border-pink-200 shrink-0">
              {userInitial}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 mt-2 w-full text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-semibold text-sm justify-center border border-transparent hover:border-rose-100"
          >
            <LogOut className="w-4 h-4" />
            Secure Logout
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col lg:flex-row max-w-[1600px] mx-auto lg:h-screen overflow-hidden bg-slate-50">
      
      {/* ===== MOBILE: Top bar with hamburger ===== */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-xl text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[9px] uppercase tracking-widest font-bold text-pink-600 leading-none mb-0.5">CS Analytics</p>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">ML Workforce Center</h2>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-bold border border-pink-200 text-sm">
              {userInitial}
            </div>
          </div>
        )}
      </div>

      {/* ===== MOBILE: Overlay backdrop ===== */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 z-40 animate-fade-in" 
          onClick={closeSidebar}
        />
      )}

      {/* ===== Sidebar: Desktop = always visible, Mobile = slide-in drawer ===== */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-[280px] shrink-0 p-6 bg-slate-50 lg:bg-slate-100/50 
        border-r border-slate-200 
        flex flex-col overflow-y-auto
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:h-screen lg:sticky lg:top-0
        ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-end mb-2">
          <button 
            onClick={closeSidebar} 
            className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* ===== Main Content Area ===== */}
      <section className="flex-1 w-full min-w-0 p-4 lg:p-8 overflow-y-auto">
        <Outlet />
      </section>
    </div>
  );
}
