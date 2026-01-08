/**
 * Payment Routes
 * Payment processing, refunds, and payment history
 */

import { Router, RequestHandler } from "express";
import { z } from "zod";
import type { Payment, PaymentRefund, ProcessPaymentRequest, SavedCard, ApiResponse, PaginatedResponse } from "@shared/api";
import { db, generateId } from "../db";
import { sendOrderNotification } from "../services/notifications";

const router = Router();

// Validation schemas
const processPaymentSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  method: z.enum(["card", "cod", "bank_transfer"]),
  cardToken: z.string().optional(),
  saveCard: z.boolean().optional(),
});

const refundSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(1),
});

// Mock payment gateway integration
async function processWithGateway(
  amount: number,
  method: string,
  cardToken?: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  // In production, integrate with actual payment gateway:
  // - Stripe: https://stripe.com/docs
  // - PayTabs: https://site.paytabs.com/en/
  // - Telr: https://telr.com/
  // - Network International: https://www.network.ae/

  console.log(`💳 Processing payment: AED ${amount} via ${method}`);

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Simulate success (95% success rate)
  if (Math.random() > 0.05) {
    return {
      success: true,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  return {
    success: false,
    error: "Payment declined. Please try another card.",
  };
}

// Mock refund processing
async function processRefundWithGateway(
  transactionId: string,
  amount: number
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  console.log(`💰 Processing refund: AED ${amount} for transaction ${transactionId}`);

  await new Promise((resolve) => setTimeout(resolve, 200));

  if (Math.random() > 0.02) {
    return {
      success: true,
      refundId: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  return {
    success: false,
    error: "Refund failed. Please try again later.",
  };
}

// GET /api/payments - Get all payments (admin)
const getPayments: RequestHandler = (req, res) => {
  try {
    const { userId, orderId, status, method, page = "1", limit = "20", startDate, endDate } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    let payments = Array.from(db.payments.values());

    // Filter by user (through orders)
    if (userId) {
      const userOrderIds = Array.from(db.orders.values())
        .filter((o) => o.userId === userId)
        .map((o) => o.id);
      payments = payments.filter((p) => userOrderIds.includes(p.orderId));
    }

    // Filter by order
    if (orderId) {
      payments = payments.filter((p) => p.orderId === orderId);
    }

    // Filter by status
    if (status) {
      payments = payments.filter((p) => p.status === status);
    }

    // Filter by method
    if (method) {
      payments = payments.filter((p) => p.method === method);
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate as string);
      payments = payments.filter((p) => new Date(p.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate as string);
      payments = payments.filter((p) => new Date(p.createdAt) <= end);
    }

    // Sort by date (newest first)
    payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const total = payments.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedPayments = payments.slice(startIndex, startIndex + limitNum);

    const response: PaginatedResponse<Payment> = {
      success: true,
      data: paginatedPayments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch payments",
    };
    res.status(500).json(response);
  }
};

// GET /api/payments/:id - Get payment by ID
const getPaymentById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const payment = db.payments.get(id);

    if (!payment) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Payment not found",
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Payment> = {
      success: true,
      data: payment,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch payment",
    };
    res.status(500).json(response);
  }
};

// GET /api/payments/order/:orderId - Get payment by order ID
const getPaymentByOrderId: RequestHandler = (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = Array.from(db.payments.values()).find((p) => p.orderId === orderId);

    if (!payment) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Payment not found for this order",
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Payment> = {
      success: true,
      data: payment,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch payment",
    };
    res.status(500).json(response);
  }
};

// POST /api/payments/process - Process payment
const processPayment: RequestHandler = async (req, res) => {
  try {
    const validation = processPaymentSchema.safeParse(req.body);
    if (!validation.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
      return res.status(400).json(response);
    }

    const { orderId, amount, method, cardToken, saveCard } = validation.data;

    // Validate order
    const order = db.orders.get(orderId);
    if (!order) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Order not found",
      };
      return res.status(404).json(response);
    }

    // Check if payment already exists
    const existingPayment = Array.from(db.payments.values()).find((p) => p.orderId === orderId);
    if (existingPayment && existingPayment.status === "captured") {
      const response: ApiResponse<null> = {
        success: false,
        error: "Payment already processed for this order",
      };
      return res.status(400).json(response);
    }

    // Process with gateway (for card payments)
    let gatewayTransactionId: string | undefined = undefined;
    if (method === "card") {
      const gatewayResult = await processWithGateway(amount, method, cardToken);

      if (!gatewayResult.success) {
        // Update order payment status
        order.paymentStatus = "failed";
        order.updatedAt = new Date().toISOString();

        // Send failure notification
        sendOrderNotification(order, "payment_failed").catch(console.error);

        const response: ApiResponse<null> = {
          success: false,
          error: gatewayResult.error || "Payment failed",
        };
        return res.status(400).json(response);
      }
      
      gatewayTransactionId = gatewayResult.transactionId;
    }

    // Create or update payment record
    const payment: Payment = existingPayment || {
      id: generateId("pay"),
      orderId,
      orderNumber: order.orderNumber,
      amount,
      currency: "AED",
      method,
      status: "pending",
      refundedAmount: 0,
      refunds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update payment status
    payment.status = method === "cod" ? "pending" : "captured";
    payment.updatedAt = new Date().toISOString();

    if (method === "card") {
      payment.gatewayTransactionId = gatewayTransactionId;
      // Mock card details
      payment.cardBrand = "Visa";
      payment.cardLast4 = "4242";
      payment.cardExpiryMonth = 12;
      payment.cardExpiryYear = 2028;
    }

    db.payments.set(payment.id, payment);

    // Update order
    order.paymentStatus = payment.status;
    order.updatedAt = new Date().toISOString();

    // Send payment confirmation notification
    if (payment.status === "captured") {
      sendOrderNotification(order, "payment_received").catch(console.error);
    }

    // Save card if requested
    if (saveCard && cardToken && method === "card") {
      const savedCard: SavedCard = {
        id: generateId("card"),
        userId: order.userId,
        brand: "Visa",
        last4: "4242",
        expiryMonth: 12,
        expiryYear: 2028,
        isDefault: true,
        token: `tok_saved_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      // In production, store saved cards in database
      console.log("Saved card:", savedCard.id);
    }

    const response: ApiResponse<Payment> = {
      success: true,
      data: payment,
      message: method === "cod" ? "Order confirmed. Pay on delivery." : "Payment successful",
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process payment",
    };
    res.status(500).json(response);
  }
};

// POST /api/payments/:id/refund - Refund payment
const refundPayment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const processedBy = req.headers["x-user-id"] as string || "admin";

    const validation = refundSchema.safeParse(req.body);
    if (!validation.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
      return res.status(400).json(response);
    }

    const { amount, reason } = validation.data;

    const payment = db.payments.get(id);
    if (!payment) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Payment not found",
      };
      return res.status(404).json(response);
    }

    // Validate refund amount
    const maxRefundable = payment.amount - payment.refundedAmount;
    if (amount > maxRefundable) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Maximum refundable amount is AED ${maxRefundable.toFixed(2)}`,
      };
      return res.status(400).json(response);
    }

    // Process refund with gateway (for card payments)
    if (payment.method === "card" && payment.gatewayTransactionId) {
      const refundResult = await processRefundWithGateway(payment.gatewayTransactionId, amount);
      if (!refundResult.success) {
        const response: ApiResponse<null> = {
          success: false,
          error: refundResult.error,
        };
        return res.status(400).json(response);
      }
    }

    // Create refund record
    const refund: PaymentRefund = {
      id: generateId("ref"),
      amount,
      reason,
      status: "completed",
      processedBy,
      createdAt: new Date().toISOString(),
    };

    payment.refunds.push(refund);
    payment.refundedAmount += amount;
    payment.status = payment.refundedAmount >= payment.amount ? "refunded" : "partially_refunded";
    payment.updatedAt = new Date().toISOString();

    // Update order
    const order = db.orders.get(payment.orderId);
    if (order) {
      order.paymentStatus = payment.status;
      if (payment.status === "refunded") {
        order.status = "refunded";
        order.statusHistory.push({
          status: "refunded",
          changedBy: processedBy,
          changedAt: new Date().toISOString(),
          notes: `Full refund: ${reason}`,
        });
      }
      order.updatedAt = new Date().toISOString();

      // Send refund notification
      sendOrderNotification(order, "refund_processed", { amount }).catch(console.error);
    }

    const response: ApiResponse<Payment> = {
      success: true,
      data: payment,
      message: `Refund of AED ${amount.toFixed(2)} processed successfully`,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process refund",
    };
    res.status(500).json(response);
  }
};

// GET /api/payments/stats - Get payment statistics
const getPaymentStats: RequestHandler = (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let payments = Array.from(db.payments.values());

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate as string);
      payments = payments.filter((p) => new Date(p.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate as string);
      payments = payments.filter((p) => new Date(p.createdAt) <= end);
    }

    const stats = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      capturedAmount: payments
        .filter((p) => p.status === "captured")
        .reduce((sum, p) => sum + p.amount, 0),
      refundedAmount: payments.reduce((sum, p) => sum + p.refundedAmount, 0),
      pendingAmount: payments
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0),
      failedPayments: payments.filter((p) => p.status === "failed").length,
      byMethod: {
        card: payments.filter((p) => p.method === "card").length,
        cod: payments.filter((p) => p.method === "cod").length,
        bankTransfer: payments.filter((p) => p.method === "bank_transfer").length,
      },
      byStatus: {
        pending: payments.filter((p) => p.status === "pending").length,
        captured: payments.filter((p) => p.status === "captured").length,
        failed: payments.filter((p) => p.status === "failed").length,
        refunded: payments.filter((p) => p.status === "refunded").length,
        partiallyRefunded: payments.filter((p) => p.status === "partially_refunded").length,
      },
    };

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch payment stats",
    };
    res.status(500).json(response);
  }
};

// POST /api/payments/:id/capture - Capture authorized payment
const capturePayment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = db.payments.get(id);

    if (!payment) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Payment not found",
      };
      return res.status(404).json(response);
    }

    if (payment.status !== "authorized" && payment.status !== "pending") {
      const response: ApiResponse<null> = {
        success: false,
        error: `Cannot capture payment with status: ${payment.status}`,
      };
      return res.status(400).json(response);
    }

    // For COD payments, mark as captured when delivery is complete
    payment.status = "captured";
    payment.updatedAt = new Date().toISOString();

    // Update order
    const order = db.orders.get(payment.orderId);
    if (order) {
      order.paymentStatus = "captured";
      order.updatedAt = new Date().toISOString();

      // Send confirmation
      sendOrderNotification(order, "payment_received").catch(console.error);
    }

    const response: ApiResponse<Payment> = {
      success: true,
      data: payment,
      message: "Payment captured successfully",
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to capture payment",
    };
    res.status(500).json(response);
  }
};

// Register routes
router.get("/", getPayments);
router.get("/stats", getPaymentStats);
router.get("/:id", getPaymentById);
router.get("/order/:orderId", getPaymentByOrderId);
router.post("/process", processPayment);
router.post("/:id/refund", refundPayment);
router.post("/:id/capture", capturePayment);

export default router;
