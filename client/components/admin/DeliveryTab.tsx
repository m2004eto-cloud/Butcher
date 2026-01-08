/**
 * Delivery Management Tab
 * Manage delivery zones, tracking, and driver assignments
 */

import React, { useEffect, useState } from "react";
import {
  MapPin,
  Truck,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Check,
  Clock,
  Package,
  User,
} from "lucide-react";
import { deliveryApi, ordersApi, usersApi } from "@/lib/api";
import type { DeliveryZone, DeliveryTracking, Order, User as UserType } from "@shared/api";
import { cn } from "@/lib/utils";
import { CurrencySymbol } from "@/components/CurrencySymbol";

interface AdminTabProps {
  onNavigate?: (tab: string, id?: string) => void;
}

export function DeliveryTab({ onNavigate }: AdminTabProps) {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"zones" | "deliveries">("deliveries");
  const [zoneModal, setZoneModal] = useState<DeliveryZone | null>(null);
  const [createZoneModal, setCreateZoneModal] = useState(false);
  const [assignModal, setAssignModal] = useState<Order | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [zonesRes, ordersRes, usersRes] = await Promise.all([
      deliveryApi.getZones(),
      ordersApi.getAll({ status: "out_for_delivery" }),
      usersApi.getAll({ role: "delivery" }),
    ]);

    if (zonesRes.success && zonesRes.data) setZones(zonesRes.data);
    if (ordersRes.success && ordersRes.data) setPendingDeliveries(ordersRes.data);
    if (usersRes.success && usersRes.data) setDrivers(usersRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateZone = async (zone: Omit<DeliveryZone, "id">) => {
    const response = await deliveryApi.createZone(zone);
    if (response.success) {
      await fetchData();
      setCreateZoneModal(false);
    }
  };

  const handleUpdateZone = async (id: string, zone: Partial<DeliveryZone>) => {
    const response = await deliveryApi.updateZone(id, zone);
    if (response.success) {
      await fetchData();
      setZoneModal(null);
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm("Are you sure you want to delete this zone?")) return;
    await deliveryApi.deleteZone(id);
    await fetchData();
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    const response = await deliveryApi.assignDriver(orderId, driverId);
    if (response.success) {
      await fetchData();
      setAssignModal(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Delivery Management</h3>
          <p className="text-sm text-slate-500">
            {zones.length} zones • {pendingDeliveries.length} active deliveries • {drivers.length} drivers
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-slate-200">
          <div className="flex gap-1 p-1">
            {[
              { id: "deliveries", label: "Active Deliveries", icon: Truck },
              { id: "zones", label: "Delivery Zones", icon: MapPin },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as typeof activeView)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    activeView === tab.id
                      ? "bg-primary text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : activeView === "deliveries" ? (
            <DeliveriesList
              deliveries={pendingDeliveries}
              drivers={drivers}
              onAssign={(order) => setAssignModal(order)}
            />
          ) : (
            <ZonesList
              zones={zones}
              onEdit={(zone) => setZoneModal(zone)}
              onDelete={handleDeleteZone}
              onCreate={() => setCreateZoneModal(true)}
            />
          )}
        </div>
      </div>

      {/* Create Zone Modal */}
      {createZoneModal && (
        <ZoneFormModal
          onClose={() => setCreateZoneModal(false)}
          onSave={handleCreateZone}
        />
      )}

      {/* Edit Zone Modal */}
      {zoneModal && (
        <ZoneFormModal
          zone={zoneModal}
          onClose={() => setZoneModal(null)}
          onSave={(data) => handleUpdateZone(zoneModal.id, data)}
        />
      )}

      {/* Assign Driver Modal */}
      {assignModal && (
        <AssignDriverModal
          order={assignModal}
          drivers={drivers}
          onClose={() => setAssignModal(null)}
          onAssign={handleAssignDriver}
        />
      )}
    </div>
  );
}

function DeliveriesList({
  deliveries,
  drivers,
  onAssign,
}: {
  deliveries: Order[];
  drivers: UserType[];
  onAssign: (order: Order) => void;
}) {
  if (deliveries.length === 0) {
    return (
      <div className="text-center py-12">
        <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No active deliveries</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deliveries.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{order.orderNumber}</p>
              <p className="text-sm text-slate-500">{order.customerName}</p>
              <p className="text-xs text-slate-400">
                {order.deliveryAddress.area}, {order.deliveryAddress.emirate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900 flex items-center justify-end gap-1">
                <CurrencySymbol size="sm" /> {order.total.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">
                {order.items.length} items
              </p>
            </div>
            <button
              onClick={() => onAssign(order)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
            >
              <User className="w-4 h-4" />
              Assign Driver
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ZonesList({
  zones,
  onEdit,
  onDelete,
  onCreate,
}: {
  zones: DeliveryZone[];
  onEdit: (zone: DeliveryZone) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Zone
        </button>
      </div>

      {zones.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No delivery zones configured</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={cn(
                "p-4 rounded-lg border-2",
                zone.isActive
                  ? "bg-white border-slate-200"
                  : "bg-slate-50 border-slate-100 opacity-60"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-slate-900">{zone.name}</h4>
                  <p className="text-sm text-slate-500">{zone.nameAr}</p>
                </div>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    zone.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-200 text-slate-500"
                  )}
                >
                  {zone.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Emirate</span>
                  <span className="font-medium">{zone.emirate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Delivery Fee</span>
                  <span className="font-medium flex items-center gap-1"><CurrencySymbol size="sm" /> {zone.deliveryFee}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Min. Order</span>
                  <span className="font-medium flex items-center gap-1"><CurrencySymbol size="sm" /> {zone.minimumOrder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Est. Time</span>
                  <span className="font-medium">{zone.estimatedMinutes} mins</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => onEdit(zone)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(zone.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ZoneFormModal({
  zone,
  onClose,
  onSave,
}: {
  zone?: DeliveryZone;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: zone?.name || "",
    nameAr: zone?.nameAr || "",
    emirate: zone?.emirate || "Dubai",
    areas: zone?.areas?.join(", ") || "",
    deliveryFee: zone?.deliveryFee?.toString() || "15",
    minimumOrder: zone?.minimumOrder?.toString() || "50",
    estimatedMinutes: zone?.estimatedMinutes?.toString() || "45",
    isActive: zone?.isActive ?? true,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const data = {
      name: formData.name,
      nameAr: formData.nameAr,
      emirate: formData.emirate,
      areas: formData.areas.split(",").map((a) => a.trim()).filter(Boolean),
      deliveryFee: parseFloat(formData.deliveryFee),
      minimumOrder: parseFloat(formData.minimumOrder),
      estimatedMinutes: parseInt(formData.estimatedMinutes),
      isActive: formData.isActive,
    };

    await onSave(data);
    setSubmitting(false);
  };

  const emirates = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Fujairah", "Ras Al Khaimah", "Umm Al Quwain"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {zone ? "Edit Delivery Zone" : "Create Delivery Zone"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Zone Name (English) *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Zone Name (Arabic)
              </label>
              <input
                type="text"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                dir="rtl"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Emirate *
            </label>
            <select
              value={formData.emirate}
              onChange={(e) => setFormData({ ...formData, emirate: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              {emirates.map((emirate) => (
                <option key={emirate} value={emirate}>
                  {emirate}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Areas (comma-separated)
            </label>
            <input
              type="text"
              value={formData.areas}
              onChange={(e) => setFormData({ ...formData, areas: e.target.value })}
              placeholder="Downtown, Marina, JBR"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Delivery Fee
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <CurrencySymbol size="sm" />
                </div>
                <input
                  type="number"
                  value={formData.deliveryFee}
                  onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Min. Order
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <CurrencySymbol size="sm" />
                </div>
                <input
                  type="number"
                  value={formData.minimumOrder}
                  onChange={(e) => setFormData({ ...formData, minimumOrder: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Est. Time (mins)
              </label>
              <input
                type="number"
                value={formData.estimatedMinutes}
                onChange={(e) => setFormData({ ...formData, estimatedMinutes: e.target.value })}
                min="1"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
              Zone is active
            </label>
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
              disabled={submitting}
              className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "Saving..." : zone ? "Save Changes" : "Create Zone"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignDriverModal({
  order,
  drivers,
  onClose,
  onAssign,
}: {
  order: Order;
  drivers: UserType[];
  onClose: () => void;
  onAssign: (orderId: string, driverId: string) => void;
}) {
  const [selectedDriver, setSelectedDriver] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;
    setSubmitting(true);
    await onAssign(order.id, selectedDriver);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Assign Driver</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500">Order</p>
            <p className="font-medium">{order.orderNumber}</p>
            <p className="text-sm text-slate-500 mt-2">Delivery to</p>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-sm text-slate-500">
              {order.deliveryAddress.area}, {order.deliveryAddress.emirate}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Driver *
            </label>
            {drivers.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                No drivers available
              </p>
            ) : (
              <div className="space-y-2">
                {drivers.map((driver) => (
                  <label
                    key={driver.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors",
                      selectedDriver === driver.id
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="driver"
                      value={driver.id}
                      checked={selectedDriver === driver.id}
                      onChange={() => setSelectedDriver(driver.id)}
                      className="sr-only"
                    />
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {driver.firstName} {driver.familyName}
                      </p>
                      <p className="text-sm text-slate-500">{driver.mobile}</p>
                    </div>
                    {selectedDriver === driver.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </label>
                ))}
              </div>
            )}
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
              disabled={submitting || !selectedDriver}
              className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "Assigning..." : "Assign Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
