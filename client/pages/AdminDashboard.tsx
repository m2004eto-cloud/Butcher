import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProducts, Product } from "@/context/ProductsContext";
import { useLanguage } from "@/context/LanguageContext";
import { PriceDisplay } from "@/components/CurrencySymbol";
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
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import admin tab components
import { DashboardTab } from "@/components/admin/DashboardTab";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { StockTab } from "@/components/admin/StockTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { DeliveryTab } from "@/components/admin/DeliveryTab";
import { PaymentsTab } from "@/components/admin/PaymentsTab";
import { ReportsTab } from "@/components/admin/ReportsTab";

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

const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "stock", label: "Inventory", icon: Package },
  { id: "products", label: "Products", icon: Package },
  { id: "users", label: "Users", icon: Users },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // Redirect if not admin
  React.useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
    }
  }, [isAdmin, navigate]);

  const categories = ["All", "Beef", "Lamb", "Sheep", "Chicken"];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "All" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const handleToggleAvailability = async (product: Product) => {
    await updateProduct(product.id, { available: !product.available });
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(productId);
    }
  };

  if (!isAdmin) {
    return null;
  }

  const handleTabNavigate = (tab: string) => {
    setActiveTab(tab as AdminTab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab onNavigate={handleTabNavigate} />;
      case "orders":
        return <OrdersTab onNavigate={handleTabNavigate} />;
      case "stock":
        return <StockTab onNavigate={handleTabNavigate} />;
      case "products":
        return (
          <ProductsManagement
            products={filteredProducts}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            categories={categories}
            onAddProduct={() => {
              setEditingProduct(null);
              setShowAddModal(true);
            }}
            onEditProduct={(product) => {
              setEditingProduct(product);
              setShowAddModal(true);
            }}
            onDeleteProduct={handleDeleteProduct}
            onToggleAvailability={handleToggleAvailability}
          />
        );
      case "users":
        return <UsersTab onNavigate={handleTabNavigate} />;
      case "delivery":
        return <DeliveryTab onNavigate={handleTabNavigate} />;
      case "payments":
        return <PaymentsTab onNavigate={handleTabNavigate} />;
      case "reports":
        return <ReportsTab onNavigate={handleTabNavigate} />;
      case "settings":
        return <SettingsTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-slate-900 text-white transition-all duration-300 lg:relative",
          sidebarCollapsed ? "w-20" : "w-64",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold text-lg">Butcher Admin</h1>
                <p className="text-xs text-slate-400">Management Panel</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
                title={sidebarCollapsed ? tab.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Info & Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => navigate("/products")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            )}
            title={sidebarCollapsed ? "View Store" : undefined}
          >
            <ExternalLink className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>View Store</span>}
          </button>

          {!sidebarCollapsed && (
            <div className="px-3 py-2">
              <p className="text-sm text-slate-400">Logged in as</p>
              <p className="font-medium truncate">{user?.firstName}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
            )}
            title={sidebarCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-slate-900 border border-slate-700 rounded-full items-center justify-center text-slate-400 hover:text-white"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h1>
          <div className="w-10" />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{renderTabContent()}</main>
      </div>

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
          onSave={async (productData) => {
            if (editingProduct) {
              await updateProduct(editingProduct.id, productData);
            } else {
              await addProduct(productData);
            }
            setShowAddModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

// Products Management Component (extracted from original)
function ProductsManagement({
  products,
  searchQuery,
  setSearchQuery,
  filterCategory,
  setFilterCategory,
  categories,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleAvailability,
}: {
  products: Product[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterCategory: string;
  setFilterCategory: (c: string) => void;
  categories: string[];
  onAddProduct: () => void;
  onEditProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onToggleAvailability: (p: Product) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Products Management
          </h3>
          <p className="text-sm text-slate-500">
            {products.length} products in catalog
          </p>
        </div>
        <button
          onClick={onAddProduct}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filterCategory === category
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-2xl">🥩</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-slate-500 line-clamp-1">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900">
                      <PriceDisplay price={product.price} size="md" />
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onToggleAvailability(product)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        product.available
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    >
                      {product.available ? "In Stock" : "Out of Stock"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEditProduct(product)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDeleteProduct(product.id)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Settings Tab Component
function SettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Settings</h3>
        <p className="text-sm text-slate-500">
          Configure your butcher shop application
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-semibold text-slate-900 mb-4">Store Information</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                defaultValue="Premium Butcher Shop"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                defaultValue="contact@butcher.ae"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                defaultValue="+971 4 123 4567"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-semibold text-slate-900 mb-4">Order Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Minimum Order Value (AED)
              </label>
              <input
                type="number"
                defaultValue="50"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Default Delivery Fee (AED)
              </label>
              <input
                type="number"
                defaultValue="15"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enableCOD"
                defaultChecked
                className="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary"
              />
              <label htmlFor="enableCOD" className="text-sm font-medium text-slate-700">
                Enable Cash on Delivery
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-semibold text-slate-900 mb-4">Notification Settings</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Email Notifications</p>
                <p className="text-sm text-slate-500">Send emails for order updates</p>
              </div>
              <button className="relative w-12 h-6 bg-primary rounded-full">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">SMS Notifications</p>
                <p className="text-sm text-slate-500">Send SMS for order updates</p>
              </div>
              <button className="relative w-12 h-6 bg-primary rounded-full">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Low Stock Alerts</p>
                <p className="text-sm text-slate-500">Get notified for low inventory</p>
              </div>
              <button className="relative w-12 h-6 bg-primary rounded-full">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-semibold text-slate-900 mb-4">VAT Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                VAT Rate (%)
              </label>
              <input
                type="number"
                defaultValue="5"
                step="0.1"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                TRN (Tax Registration Number)
              </label>
              <input
                type="text"
                defaultValue="100123456700003"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showVAT"
                defaultChecked
                className="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary"
              />
              <label htmlFor="showVAT" className="text-sm font-medium text-slate-700">
                Show VAT breakdown on invoices
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button className="px-6 py-2 border border-slate-300 rounded-lg font-medium hover:bg-slate-50">
          Reset to Defaults
        </button>
        <button className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">
          Save Changes
        </button>
      </div>
    </div>
  );
}

// Product Modal Component
interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (product: Omit<Product, "id">) => void | Promise<void>;
}

function ProductModal({ product, onClose, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    nameAr: product?.nameAr || "",
    price: product?.price?.toString() || "",
    category: product?.category || "Beef",
    description: product?.description || "",
    descriptionAr: product?.descriptionAr || "",
    image: product?.image || "",
    available: product?.available ?? true,
  });

  const categories = ["Beef", "Lamb", "Sheep", "Chicken"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      nameAr: formData.nameAr,
      price: parseFloat(formData.price) || 0,
      category: formData.category,
      description: formData.description,
      descriptionAr: formData.descriptionAr,
      image: formData.image,
      available: formData.available,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              {product ? "Edit Product" : "Add New Product"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name (English) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Product Name (English) *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Name (Arabic) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Product Name (Arabic)
              </label>
              <input
                type="text"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-right"
                dir="rtl"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Price (AED) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description (English) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description (English) *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              required
            />
          </div>

          {/* Description (Arabic) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description (Arabic)
            </label>
            <textarea
              value={formData.descriptionAr}
              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none text-right"
              dir="rtl"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="https://example.com/image.jpg"
            />
            {formData.image && (
              <div className="mt-2">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg border border-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="available"
              checked={formData.available}
              onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
              className="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary"
            />
            <label htmlFor="available" className="text-sm font-medium text-slate-700">
              Product is available (in stock)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              {product ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
