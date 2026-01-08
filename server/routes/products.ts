/**
 * Products Routes
 * CRUD operations for products
 */

import { Router, RequestHandler } from "express";
import { z } from "zod";
import type { Product, ApiResponse } from "@shared/api";
import { db, generateId } from "../db";

const router = Router();

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  price: z.number().positive(),
  costPrice: z.number().nonnegative().optional(),
  category: z.string().min(1),
  description: z.string().min(1),
  descriptionAr: z.string().optional(),
  image: z.string().optional(),
  unit: z.enum(["kg", "piece", "gram"]).optional(),
  minOrderQuantity: z.number().positive().optional(),
  maxOrderQuantity: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

const updateProductSchema = createProductSchema.partial();

// GET /api/products - Get all products
const getProducts: RequestHandler = (req, res) => {
  try {
    const { category, active, featured, search } = req.query;

    let products = Array.from(db.products.values());

    // Filter by category
    if (category) {
      products = products.filter(
        (p) => p.category.toLowerCase() === (category as string).toLowerCase()
      );
    }

    // Filter by active status
    if (active !== undefined) {
      products = products.filter((p) => p.isActive === (active === "true"));
    }

    // Filter by featured
    if (featured !== undefined) {
      products = products.filter((p) => p.isFeatured === (featured === "true"));
    }

    // Search by name or description
    if (search) {
      const searchLower = (search as string).toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          (p.nameAr && p.nameAr.includes(search as string))
      );
    }

    // Sort by name
    products.sort((a, b) => a.name.localeCompare(b.name));

    const response: ApiResponse<Product[]> = {
      success: true,
      data: products,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch products",
    };
    res.status(500).json(response);
  }
};

// GET /api/products/:id - Get product by ID
const getProductById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const product = db.products.get(id);

    if (!product) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Product not found",
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Product> = {
      success: true,
      data: product,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch product",
    };
    res.status(500).json(response);
  }
};

// POST /api/products - Create new product
const createProduct: RequestHandler = (req, res) => {
  try {
    const validation = createProductSchema.safeParse(req.body);
    if (!validation.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
      return res.status(400).json(response);
    }

    const data = validation.data;

    // Check if SKU already exists
    const existingBySku = Array.from(db.products.values()).find(
      (p) => p.sku.toLowerCase() === data.sku.toLowerCase()
    );
    if (existingBySku) {
      const response: ApiResponse<null> = {
        success: false,
        error: "A product with this SKU already exists",
      };
      return res.status(400).json(response);
    }

    const product: Product = {
      id: generateId("prod"),
      name: data.name,
      nameAr: data.nameAr,
      sku: data.sku,
      barcode: data.barcode,
      price: data.price,
      costPrice: data.costPrice || 0,
      category: data.category,
      description: data.description,
      descriptionAr: data.descriptionAr,
      image: data.image,
      unit: data.unit || "kg",
      minOrderQuantity: data.minOrderQuantity || 0.25,
      maxOrderQuantity: data.maxOrderQuantity || 10,
      isActive: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.products.set(product.id, product);

    const response: ApiResponse<Product> = {
      success: true,
      data: product,
      message: "Product created successfully",
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create product",
    };
    res.status(500).json(response);
  }
};

// PUT /api/products/:id - Update product
const updateProduct: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const product = db.products.get(id);

    if (!product) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Product not found",
      };
      return res.status(404).json(response);
    }

    const validation = updateProductSchema.safeParse(req.body);
    if (!validation.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      };
      return res.status(400).json(response);
    }

    const data = validation.data;

    // Check SKU uniqueness if updating
    if (data.sku && data.sku.toLowerCase() !== product.sku.toLowerCase()) {
      const existing = Array.from(db.products.values()).find(
        (p) => p.id !== id && p.sku.toLowerCase() === data.sku.toLowerCase()
      );
      if (existing) {
        const response: ApiResponse<null> = {
          success: false,
          error: "A product with this SKU already exists",
        };
        return res.status(400).json(response);
      }
    }

    // Update product fields
    if (data.name !== undefined) product.name = data.name;
    if (data.nameAr !== undefined) product.nameAr = data.nameAr;
    if (data.sku !== undefined) product.sku = data.sku;
    if (data.barcode !== undefined) product.barcode = data.barcode;
    if (data.price !== undefined) product.price = data.price;
    if (data.costPrice !== undefined) product.costPrice = data.costPrice;
    if (data.category !== undefined) product.category = data.category;
    if (data.description !== undefined) product.description = data.description;
    if (data.descriptionAr !== undefined) product.descriptionAr = data.descriptionAr;
    if (data.image !== undefined) product.image = data.image;
    if (data.unit !== undefined) product.unit = data.unit;
    if (data.minOrderQuantity !== undefined) product.minOrderQuantity = data.minOrderQuantity;
    if (data.maxOrderQuantity !== undefined) product.maxOrderQuantity = data.maxOrderQuantity;
    if (data.isActive !== undefined) product.isActive = data.isActive;
    if (data.isFeatured !== undefined) product.isFeatured = data.isFeatured;
    if (data.tags !== undefined) product.tags = data.tags;

    product.updatedAt = new Date().toISOString();

    const response: ApiResponse<Product> = {
      success: true,
      data: product,
      message: "Product updated successfully",
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update product",
    };
    res.status(500).json(response);
  }
};

// DELETE /api/products/:id - Delete product
const deleteProduct: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const product = db.products.get(id);

    if (!product) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Product not found",
      };
      return res.status(404).json(response);
    }

    // Soft delete - just deactivate
    product.isActive = false;
    product.updatedAt = new Date().toISOString();

    const response: ApiResponse<null> = {
      success: true,
      message: "Product deleted successfully",
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete product",
    };
    res.status(500).json(response);
  }
};

// Register routes
router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
