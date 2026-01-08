/**
 * Dashboard Tab Component
 * Real-time analytics and stats overview
 */

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Clock,
  RefreshCw,
  Eye,
  ArrowRight,
} from "lucide-react";
import { analyticsApi } from "@/lib/api";
import type { DashboardStats } from "@shared/api";
import { cn } from "@/lib/utils";
import { CurrencySymbol } from "@/components/CurrencySymbol";

interface AdminTabProps {
  onNavigate?: (tab: string, id?: string) => void;
}

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  change?: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  onClick?: () => void;
}

function StatCard({ title, value, change, icon: Icon, iconColor, iconBg, onClick }: StatCardProps) {
  return (
    <div 
      className={cn(
        "bg-white rounded-xl shadow-sm p-6",
        onClick && "cursor-pointer hover:shadow-md transition-shadow"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm font-medium",
              change >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {Math.abs(change)}% from yesterday
            </div>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
      </div>
      {onClick && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end text-sm text-primary font-medium">
          View Details <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      )}
    </div>
  );
}

export function DashboardTab({ onNavigate }: AdminTabProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    const response = await analyticsApi.getDashboard();
    if (response.success && response.data) {
      setStats(response.data);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Failed to load dashboard data</p>
        <button
          onClick={() => fetchData()}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Today's Overview</h3>
          <p className="text-sm text-slate-500">Real-time business metrics</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Revenue"
          value={
            <span className="inline-flex items-center gap-1">
              <CurrencySymbol size="md" />
              {formatCurrency(stats.todayRevenue)}
            </span>
          }
          change={stats.revenueChange.daily}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-100"
          onClick={() => onNavigate?.("reports")}
        />
        <StatCard
          title="Today's Orders"
          value={stats.todayOrders}
          change={stats.ordersChange.daily}
          icon={ShoppingCart}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
          onClick={() => onNavigate?.("orders")}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
          onClick={() => onNavigate?.("users")}
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={Clock}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
          onClick={() => onNavigate?.("orders")}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-semibold text-slate-900 mb-4">Weekly Performance</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Revenue</span>
              <span className="font-semibold inline-flex items-center gap-1">
                <CurrencySymbol size="sm" />
                {formatCurrency(stats.weekRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Orders</span>
              <span className="font-semibold">{stats.weekOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Avg. Order Value</span>
              <span className="font-semibold inline-flex items-center gap-1">
                <CurrencySymbol size="sm" />
                {formatCurrency(stats.averageOrderValue)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-semibold text-slate-900 mb-4">Monthly Performance</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Revenue</span>
              <span className="font-semibold inline-flex items-center gap-1">
                <CurrencySymbol size="sm" />
                {formatCurrency(stats.monthRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Orders</span>
              <span className="font-semibold">{stats.monthOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">New Customers</span>
              <span className="font-semibold">{stats.newCustomers}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">Low Stock Alerts</h4>
            {stats.lowStockCount > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                {stats.lowStockCount}
              </span>
            )}
          </div>
          {stats.lowStockItems.length > 0 ? (
            <div className="space-y-2">
              {stats.lowStockItems.slice(0, 3).map((item) => (
                <div
                  key={item.productId}
                  onClick={() => onNavigate?.("stock")}
                  className="flex items-center justify-between p-2 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                      {item.productName}
                    </span>
                  </div>
                  <span className="text-sm text-red-600 font-semibold">
                    {item.currentQuantity} left
                  </span>
                </div>
              ))}
              {stats.lowStockItems.length > 3 && (
                <button 
                  onClick={() => onNavigate?.("stock")}
                  className="w-full text-xs text-primary font-medium text-center mt-2 hover:underline"
                >
                  View all {stats.lowStockItems.length} alerts →
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              All products are well stocked
            </p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h4 className="font-semibold text-slate-900">Recent Orders</h4>
          <button
            onClick={() => onNavigate?.("orders")}
            className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                  Payment
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => onNavigate?.("orders")}
                      className="font-mono text-sm font-medium text-blue-600 hover:underline"
                    >
                      {order.orderNumber}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {order.itemCount} items
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    <span className="inline-flex items-center gap-1">
                      <CurrencySymbol size="sm" />
                      {formatCurrency(order.total)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onNavigate?.("orders")}
                      className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="View order"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    processing: "bg-purple-100 text-purple-700",
    out_for_delivery: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span className={cn(
      "px-2 py-1 rounded-full text-xs font-medium capitalize",
      styles[status] || "bg-slate-100 text-slate-700"
    )}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    authorized: "bg-blue-100 text-blue-700",
    captured: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-orange-100 text-orange-700",
  };

  return (
    <span className={cn(
      "px-2 py-1 rounded-full text-xs font-medium capitalize",
      styles[status] || "bg-slate-100 text-slate-700"
    )}>
      {status}
    </span>
  );
}
