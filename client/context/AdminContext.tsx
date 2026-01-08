/**
 * Admin Context
 * Provides tab navigation and shared state for admin dashboard
 */

import React, { createContext, useContext, useState, ReactNode } from "react";

type AdminTab =
  | "dashboard"
  | "orders"
  | "stock"
  | "products"
  | "users"
  | "delivery"
  | "payments"
  | "reports"
  | "settings";

interface AdminContextType {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  navigateToOrder: (orderId: string) => void;
  navigateToStock: (productId?: string) => void;
  navigateToUser: (userId?: string) => void;
  selectedOrderId: string | null;
  selectedProductId: string | null;
  selectedUserId: string | null;
  clearSelections: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const navigateToOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActiveTab("orders");
  };

  const navigateToStock = (productId?: string) => {
    if (productId) setSelectedProductId(productId);
    setActiveTab("stock");
  };

  const navigateToUser = (userId?: string) => {
    if (userId) setSelectedUserId(userId);
    setActiveTab("users");
  };

  const clearSelections = () => {
    setSelectedOrderId(null);
    setSelectedProductId(null);
    setSelectedUserId(null);
  };

  return (
    <AdminContext.Provider
      value={{
        activeTab,
        setActiveTab,
        navigateToOrder,
        navigateToStock,
        navigateToUser,
        selectedOrderId,
        selectedProductId,
        selectedUserId,
        clearSelections,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
