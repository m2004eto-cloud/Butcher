/**
 * Payments Management Tab
 * View payment history and process refunds
 */

import React, { useEffect, useState } from "react";
import {
  CreditCard,
  DollarSign,
  RefreshCw,
  X,
  Check,
  Clock,
  AlertTriangle,
  Search,
  RotateCcw,
  Eye,
  Filter,
} from "lucide-react";
import { paymentsApi } from "@/lib/api";
import type { Payment, PaymentStatus } from "@shared/api";
import { cn } from "@/lib/utils";
import { CurrencySymbol } from "@/components/CurrencySymbol";

interface AdminTabProps {
  onNavigate?: (tab: string, id?: string) => void;
}

type FilterStatus = PaymentStatus | "all";

export function PaymentsTab({ onNavigate }: AdminTabProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundModal, setRefundModal] = useState<Payment | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    const response = await paymentsApi.getAll(filter !== "all" ? { status: filter } : undefined);
    if (response.success && response.data) {
      setPayments(response.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const handleRefund = async (paymentId: string, amount: number, reason: string) => {
    const response = await paymentsApi.refund(paymentId, amount, reason);
    if (response.success) {
      await fetchPayments();
      setRefundModal(null);
    }
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.gatewayTransactionId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusConfig: Record<
    string,
    { label: string; icon: React.ElementType; color: string; bg: string }
  > = {
    pending: {
      label: "Pending",
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
    authorized: {
      label: "Authorized",
      icon: Check,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    captured: {
      label: "Captured",
      icon: Check,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    failed: {
      label: "Failed",
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-100",
    },
    refunded: {
      label: "Refunded",
      icon: RotateCcw,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    partially_refunded: {
      label: "Partial Refund",
      icon: RotateCcw,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  };

  // Calculate summary stats
  const stats = {
    totalAmount: payments
      .filter((p) => p.status === "captured")
      .reduce((sum, p) => sum + p.amount, 0),
    totalTransactions: payments.length,
    pendingCount: payments.filter((p) => p.status === "pending").length,
    refundedAmount: payments.reduce((sum, p) => sum + (p.refundedAmount || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Payment Management</h3>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            {payments.length} payments • <CurrencySymbol size="sm" /> {stats.totalAmount.toFixed(2)} total revenue
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={<span className="flex items-center gap-1"><CurrencySymbol size="md" /> {stats.totalAmount.toFixed(2)}</span>}
          color="text-green-600"
          bg="bg-green-100"
        />
        <StatCard
          icon={CreditCard}
          label="Total Transactions"
          value={stats.totalTransactions.toString()}
          color="text-blue-600"
          bg="bg-blue-100"
        />
        <StatCard
          icon={Clock}
          label="Pending Payments"
          value={stats.pendingCount.toString()}
          color="text-yellow-600"
          bg="bg-yellow-100"
        />
        <StatCard
          icon={RotateCcw}
          label="Total Refunded"
          value={<span className="flex items-center gap-1"><CurrencySymbol size="md" /> {stats.refundedAmount.toFixed(2)}</span>}
          color="text-red-600"
          bg="bg-red-100"
        />
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-xl shadow-sm">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by order ID or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterStatus)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="authorized">Authorized</option>
                <option value="captured">Captured</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="partially_refunded">Partial Refund</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPayments.map((payment) => {
                  const config = statusConfig[payment.status] || statusConfig.pending;
                  const StatusIcon = config.icon;

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <p className="font-mono text-sm text-slate-900">
                          {payment.gatewayTransactionId || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-slate-900">{payment.orderNumber || payment.orderId}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="capitalize text-sm">{payment.method}</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900 flex items-center gap-1">
                          <CurrencySymbol size="sm" /> {payment.amount.toFixed(2)}
                        </p>
                        {payment.refundedAmount ? (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            Refunded: <CurrencySymbol size="xs" /> {payment.refundedAmount.toFixed(2)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                            config.bg,
                            config.color
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {payment.status === "captured" && (
                            <button
                              onClick={() => setRefundModal(payment)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Process refund"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}

      {/* Refund Modal */}
      {refundModal && (
        <RefundModal
          payment={refundModal}
          onClose={() => setRefundModal(null)}
          onRefund={handleRefund}
        />
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bg)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-lg font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function PaymentDetailsModal({
  payment,
  onClose,
}: {
  payment: Payment;
  onClose: () => void;
}) {
  // Get refund reason from first refund if any
  const refundReason = payment.refunds?.[0]?.reason;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Payment Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
          </div>

          <DetailRow label="Transaction ID" value={payment.gatewayTransactionId || "—"} />
          <DetailRow label="Order" value={payment.orderNumber || payment.orderId} />
          <DetailRow label="Amount" value={<span className="flex items-center gap-1"><CurrencySymbol size="sm" /> {payment.amount.toFixed(2)}</span>} />
          <DetailRow label="Currency" value={payment.currency} />
          <DetailRow label="Method" value={payment.method} />
          <DetailRow label="Status" value={payment.status} />
          {payment.cardBrand && payment.cardLast4 && (
            <DetailRow label="Card" value={`${payment.cardBrand} ****${payment.cardLast4}`} />
          )}
          {payment.refundedAmount > 0 && (
            <DetailRow
              label="Refunded Amount"
              value={<span className="flex items-center gap-1"><CurrencySymbol size="sm" /> {payment.refundedAmount.toFixed(2)}</span>}
            />
          )}
          {refundReason && (
            <DetailRow label="Refund Reason" value={refundReason} />
          )}
          <DetailRow
            label="Created At"
            value={new Date(payment.createdAt).toLocaleString()}
          />
          {payment.updatedAt && (
            <DetailRow
              label="Updated At"
              value={new Date(payment.updatedAt).toLocaleString()}
            />
          )}
        </div>

        <div className="p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2 border border-slate-300 rounded-lg font-medium hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900 capitalize">{value}</span>
    </div>
  );
}

function RefundModal({
  payment,
  onClose,
  onRefund,
}: {
  payment: Payment;
  onClose: () => void;
  onRefund: (paymentId: string, amount: number, reason: string) => void;
}) {
  const [amount, setAmount] = useState(payment.amount.toString());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    await onRefund(payment.id, parseFloat(amount), reason);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Process Refund</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Refund Warning</p>
                <p className="text-sm text-yellow-700 mt-1">
                  This action cannot be undone. The refund will be processed to the
                  original payment method.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500">Original Amount</p>
            <p className="text-2xl font-bold text-slate-900 flex items-center gap-1">
              <CurrencySymbol size="lg" /> {payment.amount.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Refund Amount *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <CurrencySymbol size="sm" />
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={payment.amount}
                min="0.01"
                step="0.01"
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              Maximum refund: <CurrencySymbol size="xs" /> {payment.amount.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Refund Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="Please provide a reason for the refund..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-slate-300 rounded-lg font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Processing..." : "Process Refund"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
