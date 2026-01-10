import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { productsApi } from "@/lib/api";

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  category: string;
  description: string;
  descriptionAr?: string;
  image?: string;
  available: boolean;
}

interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "Premium Beef Steak",
    nameAr: "ستيك لحم بقري ممتاز",
    price: 89.99,
    category: "Beef",
    description: "Aged premium ribeye steak, perfect for grilling",
    descriptionAr: "ستيك ريب آي معتق ممتاز، مثالي للشوي",
    available: true,
  },
  {
    id: "prod_2",
    name: "Lamb Chops",
    nameAr: "ريش لحم ضأن",
    price: 74.5,
    category: "Lamb",
    description: "Fresh lamb chops, ideal for Mediterranean cuisine",
    descriptionAr: "ريش لحم ضأن طازجة، مثالية للمطبخ المتوسطي",
    available: true,
  },
  {
    id: "prod_6",
    name: "Sheep Leg",
    nameAr: "فخذ خروف",
    price: 125.0,
    category: "Sheep",
    description: "Whole sheep leg, perfect for traditional dishes",
    descriptionAr: "فخذ خروف كامل، مثالي للأطباق التقليدية",
    available: true,
  },
  {
    id: "prod_3",
    name: "Chicken Breast",
    nameAr: "صدر دجاج",
    price: 34.99,
    category: "Chicken",
    description: "Boneless, skinless chicken breasts - versatile and healthy",
    descriptionAr: "صدور دجاج بدون عظم وجلد - متعددة الاستخدامات وصحية",
    available: true,
  },
  {
    id: "prod_4",
    name: "Ground Beef",
    nameAr: "لحم بقري مفروم",
    price: 45.0,
    category: "Beef",
    description: "Lean ground beef for burgers and meatballs",
    descriptionAr: "لحم بقري مفروم قليل الدهن للبرغر وكرات اللحم",
    available: true,
  },
  {
    id: "prod_5",
    name: "Beef Brisket",
    nameAr: "صدر لحم بقري",
    price: 95.0,
    category: "Beef",
    description: "Slow-cooked perfection for your BBQ",
    descriptionAr: "مثالي للطهي البطيء والشواء",
    available: true,
  },
  {
    id: "prod_7",
    name: "Lamb Leg",
    nameAr: "فخذ ضأن",
    price: 125.0,
    category: "Lamb",
    description: "Whole lamb leg, perfect for family dinners",
    descriptionAr: "فخذ ضأن كامل، مثالي لعشاء العائلة",
    available: false,
  },
  {
    id: "prod_8",
    name: "Sheep Ribs",
    nameAr: "ريش خروف",
    price: 85.0,
    category: "Sheep",
    description: "Premium sheep ribs, perfect for grilling",
    descriptionAr: "ريش خروف ممتازة، مثالية للشوي",
    available: true,
  },
];

export const ProductsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("butcher_products");
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from backend on mount
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productsApi.getAll();
      if (response.success && response.data) {
        // Map backend products to frontend format
        const mappedProducts: Product[] = response.data.map((p) => ({
          id: p.id,
          name: p.name,
          nameAr: p.nameAr,
          price: p.price,
          category: p.category,
          description: p.description,
          descriptionAr: p.descriptionAr,
          image: p.image,
          available: p.isActive,
        }));
        setProducts(mappedProducts);
        localStorage.setItem("butcher_products", JSON.stringify(mappedProducts));
      }
    } catch (err) {
      setError("Failed to fetch products");
      // Keep using cached products if API fails
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    localStorage.setItem("butcher_products", JSON.stringify(products));
  }, [products]);

  const refreshProducts = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (product: Omit<Product, "id">) => {
    try {
      const response = await productsApi.create({
        name: product.name,
        nameAr: product.nameAr,
        sku: `SKU-${Date.now()}`,
        price: product.price,
        costPrice: product.price * 0.6,
        category: product.category,
        description: product.description,
        descriptionAr: product.descriptionAr,
        image: product.image,
        unit: "kg",
        minOrderQuantity: 0.25,
        maxOrderQuantity: 10,
        isActive: product.available,
        isFeatured: false,
        tags: [],
      });

      if (response.success && response.data) {
        const newProduct: Product = {
          id: response.data.id,
          name: response.data.name,
          nameAr: response.data.nameAr,
          price: response.data.price,
          category: response.data.category,
          description: response.data.description,
          descriptionAr: response.data.descriptionAr,
          image: response.data.image,
          available: response.data.isActive,
        };
        setProducts((prev) => [...prev, newProduct]);
      } else {
        // Fallback to local add
        const newProduct: Product = {
          ...product,
          id: `prod_${Date.now()}`,
        };
        setProducts((prev) => [...prev, newProduct]);
      }
    } catch {
      // Fallback to local add
      const newProduct: Product = {
        ...product,
        id: `prod_${Date.now()}`,
      };
      setProducts((prev) => [...prev, newProduct]);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const response = await productsApi.update(id, {
        name: updates.name,
        nameAr: updates.nameAr,
        price: updates.price,
        category: updates.category,
        description: updates.description,
        descriptionAr: updates.descriptionAr,
        image: updates.image,
        isActive: updates.available,
      });

      if (response.success) {
        setProducts((prev) =>
          prev.map((product) =>
            product.id === id ? { ...product, ...updates } : product
          )
        );
      } else {
        // Still update locally
        setProducts((prev) =>
          prev.map((product) =>
            product.id === id ? { ...product, ...updates } : product
          )
        );
      }
    } catch {
      // Fallback to local update
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id ? { ...product, ...updates } : product
        )
      );
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await productsApi.delete(id);
      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch {
      // Fallback to local delete
      setProducts((prev) => prev.filter((product) => product.id !== id));
    }
  };

  const getProductById = (id: string) => {
    return products.find((product) => product.id === id);
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        isLoading,
        error,
        refreshProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductsProvider");
  }
  return context;
};
