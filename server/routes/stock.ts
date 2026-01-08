/**
 * Stock Management Routes
 * Inventory tracking, auto-reduction, and low stock alerts
 */

import { Router, RequestHandler } from "express";
import { z } from "zod";
import type { StockItem, StockMovement, UpdateStockRequest, LowStockAlert, ApiResponse, Order } from "@shared/api";
import { db, generateId } from "../db";
import { sendLowStockNotifications } from "../services/notifications";

const router = Router();

// Validation schemas
const updateStockSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
  type: z.enum(["in", "out", "adjustment"]),
  reason: z.string(),
});

const bulkUpdateSchema = z.array(updateStockSchema);

// GET /api/stock - Get all stock items
const getStock: RequestHandler = (req, res) => {
  try {
    const { lowStockOnly, productId } = req.query;
    let stockItems = Array.from(db.stock.values());

    // Filter by product
    if (productId) {
      stockItems = stockItems.filter((s) => s.productId === productId);
    }

    // Filter low stock only
    if (lowStockOnly === "true") {
      stockItems = stockItems.filter((s) => s.availableQuantity <= s.lowStockThreshold);
    }

    // Enrich with product info
    const enrichedStock = stockItems.map((stock) => {
      const product = db.products.get(stock.productId);
      return {
        ...stock,
        productName: product?.name || "Unknown",
        productNameAr: product?.nameAr,
        productSku: product?.sku,
        productPrice: product?.price,
      };
    });

    const response: ApiResponse<typeof enrichedStock> = {
      success: true,
      data: enrichedStock,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch stock",
    };
    res.status(500).json(response);
  }
};

// GET /api/stock/:productId - Get stock for specific product
const getStockByProduct: RequestHandler = (req, res) => {
  try {
    const { productId } = req.params;
    const stockItem = Array.from(db.stock.values()).find((s) => s.productId === productId);

    if (!stockItem) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Stock item not found",
      };
      return res.status(404).json(response);
    }

    const product = db.products.get(productId);

    const response: ApiResponse<StockItem & { productName?: string }> = {
      success: true,
      data: {
        ...stockItem,
        productName: product?.name,
      },
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch stock",
    };
    res.status(500).json(response);
  }
};

// POST /api/stock/update - Update stock (single item)
const updateStock: RequestHandler = async (req, res) => {
  try {
    const validation = updateStockSchema.safeParse(req.body);
    if (!validation.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
      return res.status(400).json(response);
    }

    const { productId, quantity, type, reason } = validation.data;
    const performedBy = req.headers["x-user-id"] as string || "admin";

    const result = await updateStockItem(productId, quantity, type, reason, performedBy);

    if (!result.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: result.error,
      };
      return res.status(400).json(response);
    }

    const response: ApiResponse<StockItem> = {
      success: true,
      data: result.stockItem!,
      message: `Stock ${type === "in" ? "increased" : type === "out" ? "decreased" : "adjusted"} successfully`,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update stock",
    };
    res.status(500).json(response);
  }
};

// POST /api/stock/bulk-update - Update multiple stock items
const bulkUpdateStock: RequestHandler = async (req, res) => {
  try {
    const validation = bulkUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
      return res.status(400).json(response);
    }

    const updates = validation.data;
    const performedBy = req.headers["x-user-id"] as string || "admin";
    const results: { productId: string; success: boolean; error?: string }[] = [];

    for (const update of updates) {
      const result = await updateStockItem(
        update.productId,
        update.quantity,
        update.type,
        update.reason,
        performedBy
      );
      results.push({
        productId: update.productId,
        success: result.success,
        error: result.error,
      });
    }

    const response: ApiResponse<typeof results> = {
      success: true,
      data: results,
      message: `Processed ${results.length} stock updates`,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk update stock",
    };
    res.status(500).json(response);
  }
};

// GET /api/stock/alerts - Get low stock alerts
const getLowStockAlerts: RequestHandler = (req, res) => {
  try {
    const alerts: LowStockAlert[] = [];

    for (const stock of db.stock.values()) {
      if (stock.availableQuantity <= stock.lowStockThreshold) {
        const product = db.products.get(stock.productId);
        if (product) {
          alerts.push({
            productId: stock.productId,
            productName: product.name,
            currentQuantity: stock.availableQuantity,
            threshold: stock.lowStockThreshold,
            reorderPoint: stock.reorderPoint,
            suggestedReorderQuantity: stock.reorderQuantity,
          });
        }
      }
    }

    // Sort by urgency (lowest stock first)
    alerts.sort((a, b) => a.currentQuantity - b.currentQuantity);

    const response: ApiResponse<LowStockAlert[]> = {
      success: true,
      data: alerts,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch alerts",
    };
    res.status(500).json(response);
  }
};

// GET /api/stock/movements - Get stock movement history
const getStockMovements: RequestHandler = (req, res) => {
  try {
    const { productId, type, startDate, endDate, limit = "100" } = req.query;
    let movements = [...db.stockMovements];

    // Filter by product
    if (productId) {
      movements = movements.filter((m) => m.productId === productId);
    }

    // Filter by type
    if (type) {
      movements = movements.filter((m) => m.type === type);
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate as string);
      movements = movements.filter((m) => new Date(m.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate as string);
      movements = movements.filter((m) => new Date(m.createdAt) <= end);
    }

    // Sort by date (newest first)
    movements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Limit results
    movements = movements.slice(0, parseInt(limit as string));

    // Enrich with product names
    const enrichedMovements = movements.map((m) => {
      const product = db.products.get(m.productId);
      return {
        ...m,
        productName: product?.name || "Unknown",
      };
    });

    const response: ApiResponse<typeof enrichedMovements> = {
      success: true,
      data: enrichedMovements,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch movements",
    };
    res.status(500).json(response);
  }
};

// POST /api/stock/restock/:productId - Restock a product
const restockProduct: RequestHandler = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, batchNumber, expiryDate } = req.body;
    const performedBy = req.headers["x-user-id"] as string || "admin";

    if (!quantity || quantity <= 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Quantity must be greater than 0",
      };
      return res.status(400).json(response);
    }

    const stockItem = Array.from(db.stock.values()).find((s) => s.productId === productId);
    if (!stockItem) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Stock item not found",
      };
      return res.status(404).json(response);
    }

    // Update stock
    stockItem.quantity += quantity;
    stockItem.availableQuantity = stockItem.quantity - stockItem.reservedQuantity;
    stockItem.lastRestockedAt = new Date().toISOString();
    stockItem.updatedAt = new Date().toISOString();

    if (batchNumber) stockItem.batchNumber = batchNumber;
    if (expiryDate) stockItem.expiryDate = expiryDate;

    // Record movement
    const movement: StockMovement = {
      id: generateId("mov"),
      productId,
      type: "in",
      quantity,
      previousQuantity: stockItem.quantity - quantity,
      newQuantity: stockItem.quantity,
      reason: `Restock - Batch: ${batchNumber || "N/A"}`,
      referenceType: "manual",
      performedBy,
      createdAt: new Date().toISOString(),
    };
    db.stockMovements.push(movement);

    const response: ApiResponse<StockItem> = {
      success: true,
      data: stockItem,
      message: `Successfully restocked ${quantity} units`,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to restock product",
    };
    res.status(500).json(response);
  }
};

// PATCH /api/stock/:productId/thresholds - Update stock thresholds
const updateStockThresholds: RequestHandler = (req, res) => {
  try {
    const { productId } = req.params;
    const { lowStockThreshold, reorderPoint, reorderQuantity } = req.body;

    const stockItem = Array.from(db.stock.values()).find((s) => s.productId === productId);
    if (!stockItem) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Stock item not found",
      };
      return res.status(404).json(response);
    }

    if (lowStockThreshold !== undefined) stockItem.lowStockThreshold = lowStockThreshold;
    if (reorderPoint !== undefined) stockItem.reorderPoint = reorderPoint;
    if (reorderQuantity !== undefined) stockItem.reorderQuantity = reorderQuantity;
    stockItem.updatedAt = new Date().toISOString();

    const response: ApiResponse<StockItem> = {
      success: true,
      data: stockItem,
      message: "Stock thresholds updated",
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update thresholds",
    };
    res.status(500).json(response);
  }
};

// =====================================================
// HELPER FUNCTIONS (exported for use by orders)
// =====================================================

// Update stock item
export async function updateStockItem(
  productId: string,
  quantity: number,
  type: "in" | "out" | "adjustment" | "reserved" | "released",
  reason: string,
  performedBy: string,
  referenceType?: "order" | "return" | "waste" | "transfer" | "manual",
  referenceId?: string
): Promise<{ success: boolean; stockItem?: StockItem; error?: string }> {
  const stockItem = Array.from(db.stock.values()).find((s) => s.productId === productId);

  if (!stockItem) {
    return { success: false, error: `Stock item not found for product ${productId}` };
  }

  const previousQuantity = stockItem.quantity;

  // Apply change based on type
  switch (type) {
    case "in":
      stockItem.quantity += quantity;
      break;
    case "out":
      if (stockItem.availableQuantity < quantity) {
        return { success: false, error: `Insufficient stock for product ${productId}` };
      }
      stockItem.quantity -= quantity;
      break;
    case "reserved":
      if (stockItem.availableQuantity < quantity) {
        return { success: false, error: `Insufficient stock to reserve for product ${productId}` };
      }
      stockItem.reservedQuantity += quantity;
      break;
    case "released":
      stockItem.reservedQuantity = Math.max(0, stockItem.reservedQuantity - quantity);
      break;
    case "adjustment":
      stockItem.quantity = quantity;
      break;
  }

  // Recalculate available
  stockItem.availableQuantity = stockItem.quantity - stockItem.reservedQuantity;
  stockItem.updatedAt = new Date().toISOString();

  // Record movement
  const movement: StockMovement = {
    id: generateId("mov"),
    productId,
    type,
    quantity: Math.abs(quantity),
    previousQuantity,
    newQuantity: stockItem.quantity,
    reason,
    referenceType,
    referenceId,
    performedBy,
    createdAt: new Date().toISOString(),
  };
  db.stockMovements.push(movement);

  // Check for low stock alert
  if (stockItem.availableQuantity <= stockItem.lowStockThreshold) {
    const product = db.products.get(productId);
    if (product) {
      // Send low stock notification (async)
      sendLowStockNotifications(product.name, stockItem.availableQuantity, stockItem.lowStockThreshold)
        .catch(console.error);
    }
  }

  return { success: true, stockItem };
}

// Reduce stock when order is placed (reserve stock)
export function reduceStockForOrder(order: Order): { success: boolean; error?: string } {
  // First, validate all items have sufficient stock
  for (const item of order.items) {
    const stockItem = Array.from(db.stock.values()).find((s) => s.productId === item.productId);
    if (!stockItem) {
      return { success: false, error: `Stock not found for product: ${item.productName}` };
    }
    if (stockItem.availableQuantity < item.quantity) {
      return { 
        success: false, 
        error: `Insufficient stock for ${item.productName}. Available: ${stockItem.availableQuantity}, Requested: ${item.quantity}` 
      };
    }
  }

  // Reserve stock for each item
  for (const item of order.items) {
    updateStockItem(
      item.productId,
      item.quantity,
      "reserved",
      `Reserved for order ${order.orderNumber}`,
      "system",
      "order",
      order.id
    );
  }

  return { success: true };
}

// Release stock when order is cancelled
export function releaseStockForOrder(order: Order): { success: boolean; error?: string } {
  for (const item of order.items) {
    updateStockItem(
      item.productId,
      item.quantity,
      "released",
      `Released from cancelled order ${order.orderNumber}`,
      "system",
      "order",
      order.id
    );
  }

  return { success: true };
}

// Confirm stock reduction when order is delivered
export function confirmStockReductionForOrder(order: Order): { success: boolean; error?: string } {
  for (const item of order.items) {
    const stockItem = Array.from(db.stock.values()).find((s) => s.productId === item.productId);
    if (stockItem) {
      // Move from reserved to sold (reduce reserved, reduce quantity)
      stockItem.reservedQuantity = Math.max(0, stockItem.reservedQuantity - item.quantity);
      stockItem.updatedAt = new Date().toISOString();

      // Record movement
      const movement: StockMovement = {
        id: generateId("mov"),
        productId: item.productId,
        type: "out",
        quantity: item.quantity,
        previousQuantity: stockItem.quantity + item.quantity,
        newQuantity: stockItem.quantity,
        reason: `Sold via order ${order.orderNumber}`,
        referenceType: "order",
        referenceId: order.id,
        performedBy: "system",
        createdAt: new Date().toISOString(),
      };
      db.stockMovements.push(movement);
    }
  }

  return { success: true };
}

// Register routes
router.get("/", getStock);
router.get("/alerts", getLowStockAlerts);
router.get("/movements", getStockMovements);
router.get("/:productId", getStockByProduct);
router.post("/update", updateStock);
router.post("/bulk-update", bulkUpdateStock);
router.post("/restock/:productId", restockProduct);
router.patch("/:productId/thresholds", updateStockThresholds);

export default router;
