/**
 * Admin Layout Component
 * Sidebar navigation with tabs for all admin features
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
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

const tabConfig: { id: AdminTab; labelKey: string; icon: React.ElementType }[] = [
  { id: "dashboard", labelKey: "admin.dashboard", icon: LayoutDashboard },
  { id: "orders", labelKey: "admin.orders", icon: ShoppingCart },
  { id: "stock", labelKey: "admin.inventory", icon: Package },
  { id: "users", labelKey: "admin.users", icon: Users },
  { id: "delivery", labelKey: "admin.delivery", icon: Truck },
  { id: "payments", labelKey: "admin.payments", icon: CreditCard },
  { id: "reports", labelKey: "admin.reports", icon: BarChart3 },
  { id: "settings", labelKey: "admin.settings", icon: Settings },
];

export function AdminLayout({
  activeTab,
  onTabChange,
  children,
  notifications = 0,
}: AdminLayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  // Sample notifications for demo
  const sampleNotifications = [
    { id: 1, message: language === "ar" ? "طلب جديد #ORD-2026-0016" : "New order #ORD-2026-0016", time: "2m ago", unread: true },
    { id: 2, message: language === "ar" ? "تنبيه مخزون منخفض: لحم البقر" : "Low stock alert: Beef Steak", time: "15m ago", unread: true },
    { id: 3, message: language === "ar" ? "تم تسليم الطلب #ORD-2026-0012" : "Order #ORD-2026-0012 delivered", time: "1h ago", unread: false },
  ];

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
              <h1 className="font-bold text-lg">{t("admin.title")}</h1>
              <p className="text-xs text-slate-400">{t("admin.subtitle")}</p>
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
          {tabConfig.map((tab) => {
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
                {t(tab.labelKey)}
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
              {t("admin.viewStore")}
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
            <h2 className="text-xl font-bold text-slate-900">
              {activeTab === "dashboard" ? t("admin.dashboardOverview") : t(`admin.${activeTab}`)}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex gap-1 items-center bg-slate-100 border border-slate-200 rounded-md p-1">
              <button
                onClick={() => setLanguage("en")}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded transition-colors",
                  language === "en"
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-slate-200"
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("ar")}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded transition-colors",
                  language === "ar"
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-slate-200"
                )}
              >
                AR
              </button>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setNotificationOpen(false)} 
                  />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                      <h3 className="font-semibold text-slate-900">{t("admin.notifications")}</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {sampleNotifications.length > 0 ? (
                        sampleNotifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            className={cn(
                              "p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors",
                              notif.unread && "bg-blue-50/50"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              {notif.unread && (
                                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                              )}
                              <div className={cn(!notif.unread && "ml-5")}>
                                <p className="text-sm text-slate-700">{notif.message}</p>
                                <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-slate-500">
                          {t("admin.noNotifications")}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
