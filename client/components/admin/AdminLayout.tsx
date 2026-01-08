/**
 * Admin Layout Component
 * Sidebar navigation with tabs for all admin features
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Store,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminTab =
  | "dashboard"
  | "orders"
  | "stock"
  | "users"
  | "delivery"
  | "payments"
  | "reports"
  | "settings";

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: React.ReactNode;
  notifications?: number;
}

const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "stock", label: "Inventory", icon: Package },
  { id: "users", label: "Users", icon: Users },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AdminLayout({
  activeTab,
  onTabChange,
  children,
  notifications = 0,
}: AdminLayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:transform-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Butcher Admin</h1>
              <p className="text-xs text-slate-400">Management System</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                {tab.id === "orders" && notifications > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {notifications}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold">
                {user?.firstName?.[0] || "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.firstName} {user?.familyName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/products")}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
            >
              <Store className="w-4 h-4" />
              View Store
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 capitalize">
              {activeTab === "dashboard" ? "Dashboard Overview" : activeTab}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-slate-100 rounded-lg">
              <Bell className="w-5 h-5 text-slate-600" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
