/**
 * Settings Management Tab
 * Configure store settings, VAT, delivery, loyalty, wallet, and notifications
 */

import React, { useState } from "react";
import {
  Settings,
  Store,
  Percent,
  Truck,
  Gift,
  Wallet,
  Bell,
  Clock,
  Save,
  RotateCcw,
  Download,
  Upload,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings, TimeSlot } from "@/context/SettingsContext";

interface AdminTabProps {
  onNavigate?: (tab: string, id?: string) => void;
}

type SettingsSection = "store" | "tax" | "delivery" | "loyalty" | "wallet" | "notifications" | "timeslots";

export function SettingsTab({ onNavigate }: AdminTabProps) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const {
    settings,
    updateSettings,
    timeSlots,
    addTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    loyaltyTiers,
    exportSettings,
    importSettings,
    resetToDefaults,
  } = useSettings();

  const [activeSection, setActiveSection] = useState<SettingsSection>("store");
  const [saved, setSaved] = useState(false);
  const [importInput, setImportInput] = useState<HTMLInputElement | null>(null);

  const t = {
    settingsManagement: isRTL ? "إعدادات النظام" : "System Settings",
    storeInfo: isRTL ? "معلومات المتجر" : "Store Information",
    taxSettings: isRTL ? "إعدادات الضريبة" : "Tax Settings",
    deliverySettings: isRTL ? "إعدادات التوصيل" : "Delivery Settings",
    loyaltySettings: isRTL ? "إعدادات الولاء" : "Loyalty Settings",
    walletSettings: isRTL ? "إعدادات المحفظة" : "Wallet Settings",
    notificationSettings: isRTL ? "إعدادات الإشعارات" : "Notification Settings",
    timeSlots: isRTL ? "فترات التوصيل" : "Delivery Time Slots",
    
    storeName: isRTL ? "اسم المتجر" : "Store Name",
    storeNameAr: isRTL ? "اسم المتجر (عربي)" : "Store Name (Arabic)",
    contactEmail: isRTL ? "البريد الإلكتروني" : "Contact Email",
    contactPhone: isRTL ? "رقم الهاتف" : "Phone Number",
    
    vatRate: isRTL ? "نسبة ضريبة القيمة المضافة (%)" : "VAT Rate (%)",
    taxNumber: isRTL ? "رقم التسجيل الضريبي" : "Tax Registration Number",
    showVatOnInvoice: isRTL ? "إظهار الضريبة في الفاتورة" : "Show VAT on Invoice",
    
    minOrderValue: isRTL ? "الحد الأدنى للطلب (درهم)" : "Minimum Order Value (AED)",
    defaultDeliveryFee: isRTL ? "رسوم التوصيل الافتراضية (درهم)" : "Default Delivery Fee (AED)",
    freeDeliveryThreshold: isRTL ? "حد التوصيل المجاني (درهم)" : "Free Delivery Threshold (AED)",
    expressDeliveryFee: isRTL ? "رسوم التوصيل السريع (درهم)" : "Express Delivery Fee (AED)",
    sameDayCutoff: isRTL ? "وقت قطع التوصيل في نفس اليوم (ساعات)" : "Same-Day Cutoff (hours before)",
    maxAdvanceDays: isRTL ? "أقصى أيام الحجز المسبق" : "Max Advance Order Days",
    
    enableCOD: isRTL ? "تفعيل الدفع عند الاستلام" : "Enable Cash on Delivery",
    enableCard: isRTL ? "تفعيل الدفع بالبطاقة" : "Enable Card Payment",
    enableWalletPayment: isRTL ? "تفعيل الدفع بالمحفظة" : "Enable Wallet Payment",
    enableTipping: isRTL ? "تفعيل البقشيش" : "Enable Tipping",
    tipOptions: isRTL ? "خيارات البقشيش (درهم)" : "Tip Options (AED)",
    
    pointsPerAed: isRTL ? "نقاط لكل درهم" : "Points per AED Spent",
    pointsToAedRate: isRTL ? "نقاط = 1 درهم" : "Points = 1 AED",
    referralBonus: isRTL ? "مكافأة الإحالة (نقاط)" : "Referral Bonus (points)",
    birthdayBonus: isRTL ? "مكافأة عيد الميلاد (نقاط)" : "Birthday Bonus (points)",
    
    welcomeBonus: isRTL ? "مكافأة الترحيب (درهم)" : "Welcome Bonus (AED)",
    enableWelcomeBonus: isRTL ? "تفعيل مكافأة الترحيب" : "Enable Welcome Bonus",
    
    emailNotifications: isRTL ? "إشعارات البريد الإلكتروني" : "Email Notifications",
    smsNotifications: isRTL ? "إشعارات الرسائل النصية" : "SMS Notifications",
    pushNotifications: isRTL ? "إشعارات الدفع" : "Push Notifications",
    lowStockAlerts: isRTL ? "تنبيهات المخزون المنخفض" : "Low Stock Alerts",
    
    addTimeSlot: isRTL ? "إضافة فترة" : "Add Time Slot",
    start: isRTL ? "البداية" : "Start",
    end: isRTL ? "النهاية" : "End",
    enabled: isRTL ? "مفعل" : "Enabled",
    delete: isRTL ? "حذف" : "Delete",
    
    save: isRTL ? "حفظ التغييرات" : "Save Changes",
    saved: isRTL ? "تم الحفظ!" : "Saved!",
    reset: isRTL ? "إعادة التعيين" : "Reset to Defaults",
    export: isRTL ? "تصدير الإعدادات" : "Export Settings",
    import: isRTL ? "استيراد الإعدادات" : "Import Settings",
    resetConfirm: isRTL ? "هل أنت متأكد؟ سيتم استعادة جميع الإعدادات الافتراضية." : "Are you sure? This will restore all default settings.",
    importSuccess: isRTL ? "تم استيراد الإعدادات بنجاح" : "Settings imported successfully",
    importError: isRTL ? "فشل استيراد الإعدادات" : "Failed to import settings",
  };

  const sections = [
    { id: "store" as SettingsSection, icon: Store, label: t.storeInfo },
    { id: "tax" as SettingsSection, icon: Percent, label: t.taxSettings },
    { id: "delivery" as SettingsSection, icon: Truck, label: t.deliverySettings },
    { id: "timeslots" as SettingsSection, icon: Clock, label: t.timeSlots },
    { id: "loyalty" as SettingsSection, icon: Gift, label: t.loyaltySettings },
    { id: "wallet" as SettingsSection, icon: Wallet, label: t.walletSettings },
    { id: "notifications" as SettingsSection, icon: Bell, label: t.notificationSettings },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const jsonData = exportSettings();
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `butcher-settings-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const success = importSettings(event.target?.result as string);
        alert(success ? t.importSuccess : t.importError);
      };
      reader.readAsText(file);
    }
    if (importInput) importInput.value = "";
  };

  const handleReset = () => {
    if (confirm(t.resetConfirm)) {
      resetToDefaults();
    }
  };

  const handleAddTimeSlot = () => {
    addTimeSlot({
      start: "09:00",
      end: "12:00",
      enabled: true,
    });
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{t.settingsManagement}</h3>
          <p className="text-sm text-slate-500">
            {isRTL ? "تكوين إعدادات المتجر والنظام" : "Configure store and system settings"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm"
          >
            <Download className="w-4 h-4" />
            {t.export}
          </button>
          <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            {t.import}
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              ref={(el) => setImportInput(el)}
              className="hidden"
            />
          </label>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            {t.reset}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-2 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  activeSection === section.id
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <section.icon className="w-5 h-5" />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* Store Information */}
            {activeSection === "store" && (
              <div className="space-y-6">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  {t.storeInfo}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.storeName}</label>
                    <input
                      type="text"
                      value={settings.storeName}
                      onChange={(e) => updateSettings({ storeName: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.storeNameAr}</label>
                    <input
                      type="text"
                      value={settings.storeNameAr}
                      onChange={(e) => updateSettings({ storeNameAr: e.target.value })}
                      dir="rtl"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.contactEmail}</label>
                    <input
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => updateSettings({ contactEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.contactPhone}</label>
                    <input
                      type="tel"
                      value={settings.contactPhone}
                      onChange={(e) => updateSettings({ contactPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tax Settings */}
            {activeSection === "tax" && (
              <div className="space-y-6">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  {t.taxSettings}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.vatRate}</label>
                    <input
                      type="number"
                      value={settings.vatRate}
                      onChange={(e) => updateSettings({ vatRate: parseFloat(e.target.value) || 0 })}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.taxNumber}</label>
                    <input
                      type="text"
                      value={settings.taxRegistrationNumber}
                      onChange={(e) => updateSettings({ taxRegistrationNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <ToggleSwitch
                  label={t.showVatOnInvoice}
                  checked={settings.showVatOnInvoice}
                  onChange={(checked) => updateSettings({ showVatOnInvoice: checked })}
                  isRTL={isRTL}
                />
              </div>
            )}

            {/* Delivery Settings */}
            {activeSection === "delivery" && (
              <div className="space-y-6">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  {t.deliverySettings}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.minOrderValue}</label>
                    <input
                      type="number"
                      value={settings.minOrderValue}
                      onChange={(e) => updateSettings({ minOrderValue: parseFloat(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.defaultDeliveryFee}</label>
                    <input
                      type="number"
                      value={settings.defaultDeliveryFee}
                      onChange={(e) => updateSettings({ defaultDeliveryFee: parseFloat(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.freeDeliveryThreshold}</label>
                    <input
                      type="number"
                      value={settings.freeDeliveryThreshold}
                      onChange={(e) => updateSettings({ freeDeliveryThreshold: parseFloat(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.expressDeliveryFee}</label>
                    <input
                      type="number"
                      value={settings.expressDeliveryFee}
                      onChange={(e) => updateSettings({ expressDeliveryFee: parseFloat(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.sameDayCutoff}</label>
                    <input
                      type="number"
                      value={settings.sameDayCutoffHours}
                      onChange={(e) => updateSettings({ sameDayCutoffHours: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="24"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.maxAdvanceDays}</label>
                    <input
                      type="number"
                      value={settings.maxAdvanceOrderDays}
                      onChange={(e) => updateSettings({ maxAdvanceOrderDays: parseInt(e.target.value) || 0 })}
                      min="1"
                      max="30"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t">
                  <ToggleSwitch
                    label={t.enableCOD}
                    checked={settings.enableCOD}
                    onChange={(checked) => updateSettings({ enableCOD: checked })}
                    isRTL={isRTL}
                  />
                  <ToggleSwitch
                    label={t.enableCard}
                    checked={settings.enableCardPayment}
                    onChange={(checked) => updateSettings({ enableCardPayment: checked })}
                    isRTL={isRTL}
                  />
                  <ToggleSwitch
                    label={t.enableWalletPayment}
                    checked={settings.enableWalletPayment}
                    onChange={(checked) => updateSettings({ enableWalletPayment: checked })}
                    isRTL={isRTL}
                  />
                  <ToggleSwitch
                    label={t.enableTipping}
                    checked={settings.enableTipping}
                    onChange={(checked) => updateSettings({ enableTipping: checked })}
                    isRTL={isRTL}
                  />
                </div>
                {settings.enableTipping && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.tipOptions}</label>
                    <input
                      type="text"
                      value={settings.tipOptions.join(", ")}
                      onChange={(e) => {
                        const values = e.target.value.split(",").map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v));
                        updateSettings({ tipOptions: values });
                      }}
                      placeholder="5, 10, 15, 20"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Time Slots */}
            {activeSection === "timeslots" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {t.timeSlots}
                  </h4>
                  <button
                    onClick={handleAddTimeSlot}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                  >
                    + {t.addTimeSlot}
                  </button>
                </div>
                <div className="space-y-3">
                  {timeSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border",
                        slot.enabled ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-60"
                      )}
                    >
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">{t.start}</label>
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateTimeSlot(slot.id, { start: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">{t.end}</label>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateTimeSlot(slot.id, { end: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => updateTimeSlot(slot.id, { enabled: !slot.enabled })}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          slot.enabled ? "text-green-600 hover:bg-green-50" : "text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        {slot.enabled ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => deleteTimeSlot(slot.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loyalty Settings */}
            {activeSection === "loyalty" && (
              <div className="space-y-6">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  {t.loyaltySettings}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.pointsPerAed}</label>
                    <input
                      type="number"
                      value={settings.pointsPerAed}
                      onChange={(e) => updateSettings({ pointsPerAed: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.1"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.pointsToAedRate}</label>
                    <input
                      type="number"
                      value={settings.pointsToAedRate}
                      onChange={(e) => updateSettings({ pointsToAedRate: parseFloat(e.target.value) || 0 })}
                      min="1"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.referralBonus}</label>
                    <input
                      type="number"
                      value={settings.referralBonus}
                      onChange={(e) => updateSettings({ referralBonus: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.birthdayBonus}</label>
                    <input
                      type="number"
                      value={settings.birthdayBonus}
                      onChange={(e) => updateSettings({ birthdayBonus: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                {/* Loyalty Tiers Display */}
                <div className="pt-4 border-t">
                  <h5 className="text-sm font-medium text-slate-700 mb-3">
                    {isRTL ? "مستويات الولاء" : "Loyalty Tiers"}
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {loyaltyTiers.map((tier) => (
                      <div
                        key={tier.id}
                        className="p-3 rounded-lg border border-slate-200 text-center"
                        style={{ borderColor: tier.color }}
                      >
                        <div className="text-2xl mb-1">{tier.icon}</div>
                        <p className="font-medium text-sm" style={{ color: tier.color }}>
                          {isRTL ? tier.nameAr : tier.name}
                        </p>
                        <p className="text-xs text-slate-500">{tier.minPoints}+ pts</p>
                        <p className="text-xs text-slate-500">{tier.multiplier}x</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Settings */}
            {activeSection === "wallet" && (
              <div className="space-y-6">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  {t.walletSettings}
                </h4>
                <ToggleSwitch
                  label={t.enableWelcomeBonus}
                  checked={settings.enableWelcomeBonus}
                  onChange={(checked) => updateSettings({ enableWelcomeBonus: checked })}
                  isRTL={isRTL}
                />
                {settings.enableWelcomeBonus && (
                  <div className="max-w-xs">
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.welcomeBonus}</label>
                    <input
                      type="number"
                      value={settings.welcomeBonus}
                      onChange={(e) => updateSettings({ welcomeBonus: parseFloat(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Notification Settings */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  {t.notificationSettings}
                </h4>
                <div className="space-y-3">
                  <ToggleSwitch
                    label={t.emailNotifications}
                    checked={settings.enableEmailNotifications}
                    onChange={(checked) => updateSettings({ enableEmailNotifications: checked })}
                    isRTL={isRTL}
                  />
                  <ToggleSwitch
                    label={t.smsNotifications}
                    checked={settings.enableSmsNotifications}
                    onChange={(checked) => updateSettings({ enableSmsNotifications: checked })}
                    isRTL={isRTL}
                  />
                  <ToggleSwitch
                    label={t.pushNotifications}
                    checked={settings.enablePushNotifications}
                    onChange={(checked) => updateSettings({ enablePushNotifications: checked })}
                    isRTL={isRTL}
                  />
                  <ToggleSwitch
                    label={t.lowStockAlerts}
                    checked={settings.enableLowStockAlerts}
                    onChange={(checked) => updateSettings({ enableLowStockAlerts: checked })}
                    isRTL={isRTL}
                  />
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-6 mt-6 border-t flex justify-end">
              <button
                onClick={handleSave}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors",
                  saved
                    ? "bg-green-500 text-white"
                    : "bg-primary text-white hover:bg-primary/90"
                )}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    {t.saved}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t.save}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({
  label,
  checked,
  onChange,
  isRTL,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  isRTL: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
            checked ? (isRTL ? "translate-x-1" : "translate-x-6") : isRTL ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}
