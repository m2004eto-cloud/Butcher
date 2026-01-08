/**
 * Orders Management Tab
 * View, filter, and manage all orders
 */

import React, { useEffect, useState } from "react";
import {
  Search,
  Filter,
  Eye,
  Check,
  X,
  Truck,
  ChevronDown,
  RefreshCw,
  Package,
} from "lucide-react";
import { ordersApi } from "@/lib/api";
import type { Order, OrderStatus } from "@shared/api";
import { cn } from "@/lib/utils";
import { CurrencySymbol } from "@/components/CurrencySymbol";

interface AdminTabProps {
  onNavigate?: (tab: string, id?: string) => void;
}

const ORDER_STATUSES: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_ACTIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["out_for_delivery", "cancelled"],
  ready_for_pickup: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export function OrdersTab({ onNavigate }: AdminTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const params: { status?: string } = {};
    if (statusFilter !== "all") params.status = statusFilter;

    const response = await ordersApi.getAll(params);
    if (response.success && response.data) {
      setOrders(response.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(orderId);
    const response = await ordersApi.updateStatus(orderId, newStatus);
    if (response.success) {
      await fetchOrders();
      if (selectedOrder?.id === orderId && response.data) {
        setSelectedOrder(response.data);
      }
    }
    setUpdating(null);
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.customerMobile.includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Orders Management</h3>
          <p className="text-sm text-slate-500">
            {orders.length} total orders
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order #, customer name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {ORDER_STATUSES.map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  statusFilter === status.value
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No orders found</p>
          </div>
        ) : (
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-blue-600">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.customerMobile}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {order.items.length} items
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      <span className="flex items-center gap-1">
                        <CurrencySymbol size="sm" />
                        {order.total.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <PaymentStatusBadge status={order.paymentStatus} />
                        <p className="text-xs text-slate-500 mt-1 capitalize">
                          {order.paymentMethod}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {STATUS_ACTIONS[order.status]?.length > 0 && (
                          <StatusDropdown
                            orderId={order.id}
                            currentStatus={order.status}
                            availableStatuses={STATUS_ACTIONS[order.status]}
                            onUpdate={handleStatusUpdate}
                            updating={updating === order.id}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={(status) => handleStatusUpdate(selectedOrder.id, status)}
          updating={updating === selectedOrder.id}
        />
      )}
    </div>
  );
}

function StatusDropdown({
  orderId,
  currentStatus,
  availableStatuses,
  onUpdate,
  updating,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  availableStatuses: OrderStatus[];
  onUpdate: (orderId: string, status: OrderStatus) => void;
  updating: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={updating}
        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
      >
        {updating ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Update
            <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20">
            {availableStatuses.map((status) => (
              <button
                key={status}
                onClick={() => {
                  onUpdate(orderId, status);
                  setOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
              >
                {status === "cancelled" ? (
                  <X className="w-4 h-4 text-red-500" />
                ) : status === "delivered" ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : status === "out_for_delivery" ? (
                  <Truck className="w-4 h-4 text-blue-500" />
                ) : (
                  <Package className="w-4 h-4 text-slate-500" />
                )}
                <span className="capitalize">{status.replace(/_/g, " ")}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrderDetailsModal({
  order,
  onClose,
  onStatusUpdate,
  updating,
}: {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (status: OrderStatus) => void;
  updating: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Order {order.orderNumber}
            </h2>
            <p className="text-sm text-slate-500">
              Created on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Payment */}
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Order Status</p>
              <OrderStatusBadge status={order.status} />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Payment Status</p>
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Payment Method</p>
              <span className="text-sm font-medium capitalize">{order.paymentMethod}</span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Name</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-slate-500">Mobile</p>
                <p className="font-medium">{order.customerMobile}</p>
              </div>
              <div>
                <p className="text-slate-500">Email</p>
                <p className="font-medium">{order.customerEmail}</p>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Delivery Address</h3>
            <p className="text-sm text-slate-700">
              {order.deliveryAddress.building}, {order.deliveryAddress.street}
              <br />
              {order.deliveryAddress.area}, {order.deliveryAddress.emirate}
              {order.deliveryAddress.landmark && (
                <>
                  <br />
                  <span className="text-slate-500">Landmark: {order.deliveryAddress.landmark}</span>
                </>
              )}
            </p>
            {order.deliveryNotes && (
              <p className="text-sm text-slate-500 mt-2">
                <strong>Notes:</strong> {order.deliveryNotes}
              </p>
            )}
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Order Items</h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">
                      Product
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">
                      Price
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm">{item.productName}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className="flex items-center justify-end gap-1">
                          <CurrencySymbol size="sm" />
                          {item.unitPrice.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        <span className="flex items-center justify-end gap-1">
                          <CurrencySymbol size="sm" />
                          {item.totalPrice.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Subtotal</span>
                <span className="flex items-center gap-1">
                  <CurrencySymbol size="sm" />
                  {order.subtotal.toFixed(2)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Discount</span>
                  <span className="flex items-center gap-1">
                    -<CurrencySymbol size="sm" />
                    {order.discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Delivery Fee</span>
                <span className="flex items-center gap-1">
                  <CurrencySymbol size="sm" />
                  {order.deliveryFee.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">VAT ({(order.vatRate * 100).toFixed(0)}%)</span>
                <span className="flex items-center gap-1">
                  <CurrencySymbol size="sm" />
                  {order.vatAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg pt-2 border-t border-slate-300">
                <span>Total</span>
                <span className="flex items-center gap-1">
                  <CurrencySymbol size="md" />
                  {order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Actions */}
          {STATUS_ACTIONS[order.status]?.length > 0 && (
            <div className="flex gap-3">
              {STATUS_ACTIONS[order.status].map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusUpdate(status)}
                  disabled={updating}
                  className={cn(
                    "flex-1 py-3 rounded-lg font-medium transition-colors disabled:opacity-50",
                    status === "cancelled"
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-primary text-white hover:bg-primary/90"
                  )}
                >
                  {updating ? "Updating..." : `Mark as ${status.replace(/_/g, " ")}`}
                </button>
              ))}
            </div>
          )}

          {/* Status History */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Status History</h3>
            <div className="space-y-2">
              {order.statusHistory.map((history, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="capitalize font-medium">
                    {history.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-slate-500">
                    {new Date(history.changedAt).toLocaleString()}
                  </span>
                  <span className="text-slate-400">by {history.changedBy}</span>
                </div>
              ))}
            </div>
          </div>
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
    ready_for_pickup: "bg-cyan-100 text-cyan-700",
    out_for_delivery: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    refunded: "bg-orange-100 text-orange-700",
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
    partially_refunded: "bg-orange-100 text-orange-700",
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
