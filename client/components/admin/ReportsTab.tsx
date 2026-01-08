/**
 * Reports Tab
 * Sales reports, analytics charts, and data export
 */

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Package,
  DollarSign,
  ShoppingCart,
  RefreshCw,
  PieChart,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { reportsApi, analyticsApi } from "@/lib/api";
import type { SalesReportData, SalesByCategory, SalesByProduct } from "@shared/api";
import { cn } from "@/lib/utils";
import { CurrencySymbol } from "@/components/CurrencySymbol";

interface AdminTabProps {
  onNavigate?: (tab: string, id?: string) => void;
}

type ReportPeriod = "today" | "week" | "month" | "year";

// Local types for the component
interface TopProduct {
  productId: string;
  productName: string;
  sales: number;
  quantity: number;
}

interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  itemsSold: number;
  averageOrderValue: number;
  taxCollected: number;
  totalDiscounts: number;
  totalRefunds: number;
  dailySales: { date: string; revenue: number; orders: number }[];
}

export function ReportsTab({ onNavigate }: AdminTabProps) {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categorySales, setCategorySales] = useState<SalesByCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const [reportRes, topRes, categoryRes, revenueRes] = await Promise.all([
      reportsApi.getSales({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      }),
      analyticsApi.getTopProducts(period, 10),
      reportsApi.getSalesByCategory(period),
      analyticsApi.getRevenueChart(period),
    ]);

    if (reportRes.success && reportRes.data) {
      const data = reportRes.data;
      setSalesReport({
        totalRevenue: data.totalSales || 0,
        totalOrders: data.totalOrders || 0,
        itemsSold: 0, // Not in the API response
        averageOrderValue: data.averageOrderValue || 0,
        taxCollected: data.totalVat || 0,
        totalDiscounts: data.totalDiscount || 0,
        totalRefunds: 0, // Not in the API response
        dailySales: revenueRes.success && revenueRes.data 
          ? revenueRes.data.map(d => ({ date: d.date, revenue: d.revenue, orders: d.orders }))
          : [],
      });
    }
    
    if (topRes.success && topRes.data) {
      setTopProducts(topRes.data.map(p => ({
        productId: p.productId,
        productName: p.productName,
        sales: p.sales,
        quantity: p.quantity,
      })));
    }
    
    if (categoryRes.success && categoryRes.data) setCategorySales(categoryRes.data);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const handleExport = async (format: "csv" | "pdf") => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const response = await reportsApi.export(
      "sales",
      format,
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0]
    );

    if (response.success && response.data) {
      // In a real implementation, handle the download
      console.log("Export successful:", response.data);
    }
  };

  const periodLabels: Record<ReportPeriod, string> = {
    today: "Today",
    week: "Last 7 Days",
    month: "Last 30 Days",
    year: "Last Year",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Sales Reports</h3>
          <p className="text-sm text-slate-500">
            Comprehensive sales analytics and reporting
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 hidden group-hover:block z-10">
              <button
                onClick={() => handleExport("csv")}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 rounded-t-lg"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 rounded-b-lg"
              >
                Export as PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm w-fit">
        {(Object.keys(periodLabels) as ReportPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              period === p
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard
              icon={DollarSign}
              label="Total Revenue"
              value={<span className="flex items-center gap-1"><CurrencySymbol size="md" /> {salesReport?.totalRevenue?.toFixed(2) || "0.00"}</span>}
              change={12.5}
              color="green"
            />
            <SummaryCard
              icon={ShoppingCart}
              label="Total Orders"
              value={salesReport?.totalOrders?.toString() || "0"}
              change={8.2}
              color="blue"
            />
            <SummaryCard
              icon={Package}
              label="Items Sold"
              value={salesReport?.itemsSold?.toString() || "0"}
              change={-3.1}
              color="purple"
            />
            <SummaryCard
              icon={TrendingUp}
              label="Avg. Order Value"
              value={<span className="flex items-center gap-1"><CurrencySymbol size="md" /> {salesReport?.averageOrderValue?.toFixed(2) || "0.00"}</span>}
              change={5.7}
              color="orange"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-900">Top Selling Products</h4>
                <BarChart3 className="w-5 h-5 text-slate-400" />
              </div>

              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No sales data available
                </div>
              ) : (
                <div className="space-y-3">
                  {topProducts.slice(0, 5).map((product, index) => (
                    <div
                      key={product.productId}
                      className="flex items-center gap-4"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{product.productName}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>{product.quantity} sold</span>
                          <span className="flex items-center gap-1"><CurrencySymbol size="xs" /> {product.sales.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="w-24 bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${(product.sales / (topProducts[0]?.sales || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sales by Category */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-900">Sales by Category</h4>
                <PieChart className="w-5 h-5 text-slate-400" />
              </div>

              {categorySales.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No category data available
                </div>
              ) : (
                <div className="space-y-4">
                  {categorySales.map((category, index) => {
                    const colors = [
                      "bg-red-500",
                      "bg-blue-500",
                      "bg-green-500",
                      "bg-yellow-500",
                      "bg-purple-500",
                      "bg-pink-500",
                    ];
                    const totalRevenue = categorySales.reduce(
                      (sum, c) => sum + c.totalSales,
                      0
                    );
                    const displayPercentage = category.percentage || (totalRevenue
                      ? ((category.totalSales / totalRevenue) * 100).toFixed(1)
                      : "0");

                    return (
                      <div key={category.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-3 h-3 rounded-full",
                                colors[index % colors.length]
                              )}
                            />
                            <span className="text-sm font-medium text-slate-900">
                              {category.category}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium flex items-center justify-end gap-1">
                              <CurrencySymbol size="xs" /> {category.totalSales.toFixed(2)}
                            </span>
                            <span className="text-xs text-slate-500 ml-2">
                              ({displayPercentage}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full",
                              colors[index % colors.length]
                            )}
                            style={{ width: `${displayPercentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Daily Sales Chart Placeholder */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-semibold text-slate-900">Revenue Trend</h4>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                {periodLabels[period]}
              </div>
            </div>

            {/* Simplified bar chart visualization */}
            <div className="h-64 flex items-end justify-between gap-2">
              {(salesReport?.dailySales || []).slice(-14).map((day, index) => {
                const maxRevenue = Math.max(
                  ...(salesReport?.dailySales || []).map((d) => d.revenue)
                );
                const height = maxRevenue ? (day.revenue / maxRevenue) * 100 : 0;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-primary/80 rounded-t-lg transition-all hover:bg-primary"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${day.date}: AED ${day.revenue.toFixed(2)}`}
                    />
                    <span className="text-xs text-slate-500 truncate w-full text-center">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                );
              })}
              {(!salesReport?.dailySales || salesReport.dailySales.length === 0) && (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  No daily sales data available for this period
                </div>
              )}
            </div>
          </div>

          {/* Detailed Stats Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h4 className="font-semibold text-slate-900">Detailed Breakdown</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Metric
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                      Value
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">Gross Revenue</td>
                    <td className="px-4 py-3 text-sm text-right font-medium flex items-center justify-end gap-1">
                      <CurrencySymbol size="sm" /> {salesReport?.totalRevenue?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChangeIndicator value={12.5} />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">Total Tax Collected</td>
                    <td className="px-4 py-3 text-sm text-right font-medium flex items-center justify-end gap-1">
                      <CurrencySymbol size="sm" /> {salesReport?.taxCollected?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChangeIndicator value={8.3} />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">Total Discounts</td>
                    <td className="px-4 py-3 text-sm text-right font-medium flex items-center justify-end gap-1">
                      <CurrencySymbol size="sm" /> {salesReport?.totalDiscounts?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChangeIndicator value={-5.2} />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">Net Revenue</td>
                    <td className="px-4 py-3 text-sm text-right font-medium flex items-center justify-end gap-1">
                      <CurrencySymbol size="sm" />{" "}
                      {(
                        (salesReport?.totalRevenue || 0) -
                        (salesReport?.totalDiscounts || 0)
                      ).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChangeIndicator value={10.1} />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">Total Refunds</td>
                    <td className="px-4 py-3 text-sm text-right font-medium flex items-center justify-end gap-1">
                      <CurrencySymbol size="sm" /> {salesReport?.totalRefunds?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChangeIndicator value={-15.3} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  change,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  change: number;
  color: "green" | "blue" | "purple" | "orange";
}) {
  const colorClasses = {
    green: { bg: "bg-green-100", text: "text-green-600" },
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    purple: { bg: "bg-purple-100", text: "text-purple-600" },
    orange: { bg: "bg-orange-100", text: "text-orange-600" },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            colorClasses[color].bg
          )}
        >
          <Icon className={cn("w-6 h-6", colorClasses[color].text)} />
        </div>
      </div>
      <div className="mt-4">
        <ChangeIndicator value={change} showLabel />
      </div>
    </div>
  );
}

function ChangeIndicator({
  value,
  showLabel = false,
}: {
  value: number;
  showLabel?: boolean;
}) {
  const isPositive = value >= 0;
  const Icon = isPositive ? ArrowUp : ArrowDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium",
        isPositive ? "text-green-600" : "text-red-600"
      )}
    >
      <Icon className="w-3 h-3" />
      {Math.abs(value).toFixed(1)}%
      {showLabel && (
        <span className="text-slate-500 font-normal ml-1">vs previous period</span>
      )}
    </span>
  );
}
